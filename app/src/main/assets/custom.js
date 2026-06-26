window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});from flask import Flask, request, jsonify, render_template_string
import json
import os
from datetime import datetime

app = Flask(__name__)

CURRENT_CMD = 0
STATE_FILE = "fan_state.json"

sensor_data = {
    "temperature": 0.0,
    "humidity": 0.0,
    "smoke_value": 0,
    "smoke_level": "正常"
}

def load_state():
    global CURRENT_CMD
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            data = json.load(f)
            CURRENT_CMD = data.get("cmd", 0)

def save_state():
    with open(STATE_FILE, 'w') as f:
        json.dump({"cmd": CURRENT_CMD}, f)

load_state()

HTML_PAGE = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>智能环境监控 | 风扇控制器</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', 'Roboto', system-ui, sans-serif;
            background: #eef2f5;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .controller {
            background: #ffffff;
            width: 100%;
            max-width: 550px;
            border: 1px solid #d0d7de;
            padding: 28px 24px 24px;
        }
        .datetime-box {
            border-bottom: 2px solid #1e2a3e;
            padding-bottom: 12px;
            margin-bottom: 28px;
            text-align: left;
        }
        .date { font-size: 18px; font-weight: 500; color: #1f2d3d; margin-bottom: 6px; }
        .time { font-family: monospace; font-size: 28px; font-weight: 600; color: #0a0c10; }
        .time small { font-size: 16px; font-weight: normal; color: #4a627a; margin-left: 6px; }
        .title {
            margin-bottom: 24px;
            border-left: 4px solid #d1452b;
            padding-left: 14px;
        }
        .title h1 { font-size: 26px; font-weight: 600; color: #1e2a3e; }
        .title p { font-size: 13px; color: #5c6f87; margin-top: 6px; }
        .sensor-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 28px;
        }
        .sensor-card {
            flex: 1;
            min-width: 120px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            text-align: center;
        }
        .sensor-label { font-size: 12px; font-weight: 500; text-transform: uppercase; color: #4b5565; }
        .sensor-value { font-size: 22px; font-weight: 700; margin-top: 6px; color: #1e293b; }
        .smoke-level { font-size: 16px; font-weight: 600; margin-top: 4px; padding: 4px; background: #eef2f5; display: inline-block; }
        .button-group {
            display: flex;
            gap: 20px;
            margin: 24px 0 28px;
        }
        .btn {
            flex: 1;
            padding: 14px 0;
            font-size: 20px;
            font-weight: 500;
            text-align: center;
            background: #f6f8fa;
            border: 1px solid #cbd5e1;
            cursor: pointer;
            transition: all 0.15s;
        }
        .btn-on { border-color: #2c6e2f; color: #2c6e2f; }
        .btn-on:hover { background: #2c6e2f; color: white; }
        .btn-off { border-color: #b91c1c; color: #b91c1c; }
        .btn-off:hover { background: #b91c1c; color: white; }
        .status-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px;
            text-align: center;
            margin-bottom: 28px;
        }
        .status-label { font-size: 14px; font-weight: 500; text-transform: uppercase; color: #4b5565; }
        .status-value { font-size: 24px; font-weight: 700; margin-top: 8px; color: #1e293b; }
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 8px;
            font-size: 13px;
            text-align: center;
            color: #5c6f87;
        }
        .signature { font-size: 13px; font-weight: 500; margin-top: 6px; color: #2c3e4e; }
    </style>
</head>
<body>
<div class="controller">
    <div class="datetime-box">
        <div class="date" id="currentDate"></div>
        <div class="time"><span id="currentTime">--:--:--</span><small id="timeSuffix"></small></div>
    </div>
    <div class="title">
        <h1>环境监控 · 风扇控制器</h1>
        <p>MQ-2烟雾 | DHT11温湿度 | ESP32-S3</p>
    </div>
    <div class="sensor-grid">
        <div class="sensor-card"><div class="sensor-label">温度</div><div class="sensor-value" id="temp">-- ℃</div></div>
        <div class="sensor-card"><div class="sensor-label">湿度</div><div class="sensor-value" id="humi">-- %</div></div>
        <div class="sensor-card"><div class="sensor-label">烟雾值</div><div class="sensor-value" id="smokeVal">--</div><div class="smoke-level" id="smokeLevel">--</div></div>
    </div>
    <div class="button-group">
        <button id="onBtn" class="btn btn-on">开风扇</button>
        <button id="offBtn" class="btn btn-off">关风扇</button>
    </div>
    <div class="status-card">
        <div class="status-label">风扇运行状态</div>
        <div class="status-value" id="status">--</div>
    </div>
    <div class="footer">
        <div>实时同步数据</div>
        <div class="signature">24电信3班19号 樊星明</div>
    </div>
</div>
<script>
    function updateDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth()+1).padStart(2,'0');
        const day = String(now.getDate()).padStart(2,'0');
        const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        const weekday = weekdays[now.getDay()];
        const hours = String(now.getHours()).padStart(2,'0');
        const minutes = String(now.getMinutes()).padStart(2,'0');
        const seconds = String(now.getSeconds()).padStart(2,'0');
        document.getElementById('currentDate').innerText = `${year}年${month}月${day}日 ${weekday}`;
        document.getElementById('currentTime').innerText = `${hours}:${minutes}:${seconds}`;
        document.getElementById('timeSuffix').innerText = hours<12?'AM':'PM';
    }
    updateDateTime();
    setInterval(updateDateTime,1000);

    async function fetchFanStatus() {
        try {
            const response = await fetch('/cmd');
            const cmd = parseInt(await response.text(),10);
            document.getElementById('status').innerText = cmd===1?'风扇开启':'风扇关闭';
        } catch(e) { console.warn(e); }
    }

    async function fetchSensorData() {
        try {
            const res = await fetch('/api/sensor');
            const data = await res.json();
            document.getElementById('temp').innerHTML = data.temperature.toFixed(1)+" ℃";
            document.getElementById('humi').innerHTML = data.humidity.toFixed(1)+" %";
            document.getElementById('smokeVal').innerHTML = data.smoke_value;
            const levelSpan = document.getElementById('smokeLevel');
            levelSpan.innerText = data.smoke_level;
            if(data.smoke_level === '超标') levelSpan.style.color = '#b91c1c';
            else if(data.smoke_level === '一般') levelSpan.style.color = '#e68a2e';
            else levelSpan.style.color = '#2c6e2f';
        } catch(e) { console.warn("传感器数据获取失败",e); }
    }

    async function sendCommand(action) {
        try {
            const response = await fetch('/control', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({action:action})
            });
            const data = await response.json();
            if(data.status==='ok') {
                document.getElementById('status').innerText = action==='on'?'风扇开启':'风扇关闭';
            } else alert('指令失败');
        } catch(e) { alert('网络错误'); }
    }

    document.getElementById('onBtn').addEventListener('click',()=>sendCommand('on'));
    document.getElementById('offBtn').addEventListener('click',()=>sendCommand('off'));

    fetchFanStatus();
    fetchSensorData();
    setInterval(()=>{ fetchFanStatus(); fetchSensorData(); }, 1000);
</script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_PAGE)

@app.route('/cmd', methods=['GET'])
def get_command():
    return str(CURRENT_CMD), 200, {'Content-Type': 'text/plain'}

@app.route('/control', methods=['POST'])
def control():
    global CURRENT_CMD
    data = request.get_json()
    action = data.get('action')
    if action == "on":
        CURRENT_CMD = 1
    elif action == "off":
        CURRENT_CMD = 0
    else:
        return jsonify({"status": "error", "msg": "invalid action"}), 400
    save_state()
    return jsonify({"status": "ok", "cmd": CURRENT_CMD})

@app.route('/api/sensor', methods=['GET'])
def get_sensor():
    return jsonify(sensor_data)

@app.route('/sensor_data', methods=['POST'])
def update_sensor():
    global sensor_data
    try:
        data = request.get_json()
        sensor_data['temperature'] = data.get('temperature', 0.0)
        sensor_data['humidity'] = data.get('humidity', 0.0)
        sensor_data['smoke_value'] = data.get('smoke_value', 0)
        sensor_data['smoke_level'] = data.get('smoke_level', '正常')
        print(f"[传感器] 收到: {sensor_data}")
        return jsonify({"status": "ok"})
    except Exception as e:
        print(f"[错误] {e}")
        return jsonify({"status": "error"}), 500

if __name__ == '__main__':
    print("服务器启动: http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)