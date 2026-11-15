// 포즈 인식 전용 작업 공간 (Web Worker)
//  - AI 인식(프레임당 수백 ms)을 화면 그리기·녹화와 분리해, 인식 중에도 화면·녹화가 끊기지 않게 함
//  - classic worker로 실행: 엔진이 wasm 로더를 importScripts로 불러오기 때문 (module worker에서는 실패)
//  - 주고받는 메시지
//      init   → ready { delegate } | error { message }
//      frame { id, bitmap, ts } → result { id, landmarks: [[{x,y,z,visibility}, ...], ...] }
//                                 인식을 못 돌린 프레임은 result { id, failed: true } (판정에 반영하지 않음)
"use strict";

var landmarker = null;
var lastTs = 0;

function toPlain(list) {
    var out = [];
    for (var i = 0; list && i < list.length; i++) {
        var pts = [];
        for (var j = 0; j < list[i].length; j++) {
            var p = list[i][j];
            pts.push({ x: p.x, y: p.y, z: p.z, visibility: p.visibility });
        }
        out.push(pts);
    }
    return out;
}

function init(msg) {
    import(msg.base + "/vision_bundle.mjs").then(function(vision) {
        return vision.FilesetResolver.forVisionTasks(msg.base + "/wasm").then(function(fileset) {
            function create(delegate) {
                return vision.PoseLandmarker.createFromOptions(fileset, {
                    baseOptions: { modelAssetPath: msg.model, delegate: delegate },
                    runningMode: "VIDEO",
                    numPoses: 2,
                    minPoseDetectionConfidence: 0.60,
                    minPosePresenceConfidence: 0.55,
                    minTrackingConfidence: 0.55
                }).then(function(lm) { return { lm: lm, delegate: delegate }; });
            }
            // GPU를 못 쓰는 기기는 CPU로 재시도
            return create("GPU").catch(function() { return create("CPU"); });
        });
    }).then(function(r) {
        landmarker = r.lm;
        self.postMessage({ type: "ready", delegate: r.delegate });
    }, function(e) {
        self.postMessage({ type: "error", message: String((e && e.message) || e) });
    });
}

function detect(msg) {
    var out = { type: "result", id: msg.id };
    try {
        var ts = msg.ts;
        if (ts <= lastTs) ts = lastTs + 1;   // VIDEO 모드는 시각이 계속 증가해야 함
        lastTs = ts;
        var res = landmarker.detectForVideo(msg.bitmap, ts);
        out.landmarks = toPlain(res && res.landmarks);
    } catch (e) {
        out.failed = true;
    }
    msg.bitmap.close();
    self.postMessage(out);
}

self.onmessage = function(ev) {
    var msg = ev.data;
    if (msg.type === "init") {
        init(msg);
    } else if (msg.type === "frame") {
        if (!landmarker) {
            msg.bitmap.close();
            self.postMessage({ type: "result", id: msg.id, failed: true });
            return;
        }
        detect(msg);
    }
};
