const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

// 创建Express应用
const app = express();
const port = 3000;

// 提供静态文件服务
app.use(express.static(path.join(__dirname)));

// 添加CORS支持
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

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

console.log('服务器启动中 | Server starting...');

// WebSocket连接处理
wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`新客户端连接 | New client connected from ${clientIp}`);
    clients.add(ws);

    // 发送当前数据给新连接的客户端
    const initMessage = {
        type: 'init',
        data: sharedData,
        timestamp: Date.now()
    };
    
    try {
        ws.send(JSON.stringify(initMessage));
        console.log('已发送初始化数据 | Sent initialization data to new client');
    } catch (error) {
        console.error('发送初始化数据失败 | Failed to send initialization data:', error);
    }

    // 处理客户端消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log(`收到消息 | Received message from ${clientIp}:`, data.type);

            switch (data.type) {
                case 'update_data':
                    // 更新共享数据
                    sharedData = {
                        ...sharedData,
                        ...data.data,
                        lastUpdate: Date.now(),
                        updateUser: data.user || 'Unknown'
                    };
                    
                    console.log(`数据已更新 | Data updated by ${data.user || 'Unknown'}`);
                    
                    // 广播给所有其他客户端
                    broadcastToOthers(ws, {
                        type: 'data_updated',
                        data: sharedData,
                        timestamp: Date.now()
                    });
                    break;

                case 'user_login':
                    // 用户登录
                    if (!sharedData.onlineUsers.find(u => u.name === data.user.name)) {
                        sharedData.onlineUsers.push(data.user);
                        console.log(`用户登录 | User logged in: ${data.user.name}`);
                        broadcastToAll({
                            type: 'user_joined',
                            user: data.user,
                            onlineUsers: sharedData.onlineUsers,
                            timestamp: Date.now()
                        });
                    }
                    break;

                case 'user_logout':
                    // 用户登出
                    sharedData.onlineUsers = sharedData.onlineUsers.filter(u => u.name !== data.user.name);
                    console.log(`用户登出 | User logged out: ${data.user.name}`);
                    broadcastToAll({
                        type: 'user_left',
                        user: data.user,
                        onlineUsers: sharedData.onlineUsers,
                        timestamp: Date.now()
                    });
                    break;

                case 'heartbeat':
                    // 心跳包
                    ws.send(JSON.stringify({
                        type: 'heartbeat_ack',
                        timestamp: Date.now()
                    }));
                    break;

                case 'test':
                    // 测试消息
                    console.log('收到测试消息 | Received test message:', data.data);
                    ws.send(JSON.stringify({
                        type: 'test_response',
                        data: 'Hello from server!',
                        timestamp: Date.now()
                    }));
                    break;

                default:
                    console.log('未知消息类型 | Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('处理消息错误 | Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
                timestamp: Date.now()
            }));
        }
    });

    // 客户端断开连接
    ws.on('close', () => {
        console.log(`客户端断开连接 | Client disconnected from ${clientIp}`);
        clients.delete(ws);
        
        // 定期清理断开的连接
        setTimeout(() => {
            if (clients.has(ws)) {
                clients.delete(ws);
            }
        }, 1000);
    });

    // 错误处理
    ws.on('error', (error) => {
        console.error(`WebSocket错误 | WebSocket error from ${clientIp}:`, error);
        clients.delete(ws);
    });
});

// 广播给所有客户端
function broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(messageStr);
                sentCount++;
            } catch (error) {
                console.error('广播消息失败 | Failed to broadcast message:', error);
                clients.delete(client);
            }
        }
    });
    
    console.log(`广播消息 | Broadcasted message to ${sentCount} clients`);
}

// 广播给除指定客户端外的所有客户端
function broadcastToOthers(excludeWs, message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    clients.forEach(client => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            try {
                client.send(messageStr);
                sentCount++;
            } catch (error) {
                console.error('广播消息失败 | Failed to broadcast message:', error);
                clients.delete(client);
            }
        }
    });
    
    console.log(`广播消息 | Broadcasted message to ${sentCount} other clients`);
}

// 启动服务器
server.listen(port, () => {
    console.log(`✅ 服务器运行在 | Server running at http://localhost:${port}`);
    console.log(`✅ WebSocket服务器运行在 | WebSocket server running at ws://localhost:${port}`);
    console.log(`📊 当前连接数 | Current connections: ${clients.size}`);
});

// 定期清理断开的连接
setInterval(() => {
    const beforeCount = clients.size;
    clients.forEach(client => {
        if (client.readyState === WebSocket.CLOSED) {
            clients.delete(client);
        }
    });
    const afterCount = clients.size;
    
    if (beforeCount !== afterCount) {
        console.log(`清理断开的连接 | Cleaned up ${beforeCount - afterCount} disconnected clients`);
    }
}, 30000); // 每30秒清理一次

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器 | Shutting down server...');
    wss.close(() => {
        console.log('WebSocket服务器已关闭 | WebSocket server closed');
        server.close(() => {
            console.log('HTTP服务器已关闭 | HTTP server closed');
            process.exit(0);
        });
    });
}); 