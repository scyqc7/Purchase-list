const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

// 创建Express应用
const app = express();
const port = 3000;

// 提供静态文件服务
app.use(express.static(path.join(__dirname)));

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 存储连接的客户端
const clients = new Set();
// 存储共享数据
let sharedData = {
    purchaseItems: [],
    approvalItems: [],
    approvalFileName: '',
    onlineUsers: [],
    lastUpdate: Date.now(),
    updateUser: 'System'
};

// WebSocket连接处理
wss.on('connection', (ws) => {
    console.log('新客户端连接 | New client connected');
    clients.add(ws);

    // 发送当前数据给新连接的客户端
    ws.send(JSON.stringify({
        type: 'init',
        data: sharedData
    }));

    // 处理客户端消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('收到消息 | Received message:', data.type);

            switch (data.type) {
                case 'update_data':
                    // 更新共享数据
                    sharedData = {
                        ...sharedData,
                        ...data.data,
                        lastUpdate: Date.now(),
                        updateUser: data.user || 'Unknown'
                    };
                    
                    // 广播给所有其他客户端
                    broadcastToOthers(ws, {
                        type: 'data_updated',
                        data: sharedData
                    });
                    break;

                case 'user_login':
                    // 用户登录
                    if (!sharedData.onlineUsers.find(u => u.name === data.user.name)) {
                        sharedData.onlineUsers.push(data.user);
                        broadcastToAll({
                            type: 'user_joined',
                            user: data.user,
                            onlineUsers: sharedData.onlineUsers
                        });
                    }
                    break;

                case 'user_logout':
                    // 用户登出
                    sharedData.onlineUsers = sharedData.onlineUsers.filter(u => u.name !== data.user.name);
                    broadcastToAll({
                        type: 'user_left',
                        user: data.user,
                        onlineUsers: sharedData.onlineUsers
                    });
                    break;

                case 'heartbeat':
                    // 心跳包
                    ws.send(JSON.stringify({
                        type: 'heartbeat_ack',
                        timestamp: Date.now()
                    }));
                    break;
            }
        } catch (error) {
            console.error('处理消息错误 | Error processing message:', error);
        }
    });

    // 客户端断开连接
    ws.on('close', () => {
        console.log('客户端断开连接 | Client disconnected');
        clients.delete(ws);
    });

    // 错误处理
    ws.on('error', (error) => {
        console.error('WebSocket错误 | WebSocket error:', error);
        clients.delete(ws);
    });
});

// 广播给所有客户端
function broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// 广播给除指定客户端外的所有客户端
function broadcastToOthers(excludeWs, message) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
        }
    });
}

// 启动服务器
server.listen(port, () => {
    console.log(`服务器运行在 | Server running at http://localhost:${port}`);
    console.log(`WebSocket服务器运行在 | WebSocket server running at ws://localhost:${port}`);
});

// 定期清理断开的连接
setInterval(() => {
    clients.forEach(client => {
        if (client.readyState === WebSocket.CLOSED) {
            clients.delete(client);
        }
    });
}, 30000); // 每30秒清理一次 