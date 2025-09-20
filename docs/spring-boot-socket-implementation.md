# Backend Socket Implementation Guide for Bus Tracking Application
 
## Overview

This document provides implementation instructions for backend engineers to set up a real-time socket server for the bus tracking application using:
- Spring Boot
- Socket.IO (Java implementation)
- Redis for pub/sub
- Docker for containerization

The frontend expects real-time updates for:
1. Bus locations
2. Traffic conditions
3. Stop arrival times
4. Route delays

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Data Sources   │     │  Spring Boot    │     │   Next.js       │
│  (GPS, Traffic) │────▶│  Socket Server  │────▶│   Frontend      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────▼────────┐
                        │      Redis      │
                        │   (Pub/Sub)     │
                        └─────────────────┘
```

## Prerequisites

- Java 17+
- Maven or Gradle
- Docker and Docker Compose
- Redis

## Dependencies

Add these to your Spring Boot `pom.xml` or `build.gradle`:

```xml
<!-- For Maven -->
<dependencies>
    <!-- Spring Boot Starter WebSocket -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>
    
    <!-- Socket.IO Java Server -->
    <dependency>
        <groupId>com.corundumstudio.socketio</groupId>
        <artifactId>netty-socketio</artifactId>
        <version>1.7.23</version>
    </dependency>
    
    <!-- Redis -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <!-- JSON Processing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-json</artifactId>
    </dependency>
</dependencies>
```

For Gradle:
```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
    implementation 'com.corundumstudio.socketio:netty-socketio:1.7.23'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-json'
}
```

## Implementation Steps

### 1. Define Data Models

Create the following model classes to match the frontend expectations:

```java
// BusLocationUpdate.java
public class BusLocationUpdate {
    private String busId;
    private String routeId;
    private double latitude;
    private double longitude;
    private double heading;
    private double speed;
    private String nextStopId;
    private String estimatedArrival;
    private long timestamp;
    
    // Getters and setters
}

// TrafficUpdate.java
public class TrafficUpdate {
    private TrafficArea area;
    private String condition; // "light", "moderate", "heavy"
    private int delay;
    private String cause;
    private long timestamp;
    
    // Getters and setters
    
    public static class TrafficArea {
        private double centerLat;
        private double centerLng;
        private Double radius;
        private List<GeoPoint> points;
        
        // Getters and setters
    }
    
    public static class GeoPoint {
        private double lat;
        private double lng;
        
        // Getters and setters
    }
}

// StopTimesUpdate.java
public class StopTimesUpdate {
    private String stopId;
    private List<BusEstimate> buses;
    private long timestamp;
    
    // Getters and setters
    
    public static class BusEstimate {
        private String busId;
        private String routeId;
        private String routeName;
        private String estimatedArrival;
        private double distance;
        private boolean isApproaching;
        
        // Getters and setters
    }
}

// RouteDelayUpdate.java
public class RouteDelayUpdate {
    private String routeId;
    private String routeName;
    private int delayMinutes;
    private String reason;
    private List<String> affectedStops;
    private long timestamp;
    
    // Getters and setters
}

// BoundingBox.java
public class BoundingBox {
    private double north; // lat max
    private double south; // lat min
    private double east;  // lng max
    private double west;  // lng min
    
    // Getters and setters
    
    public boolean containsPoint(double lat, double lng) {
        return lat <= north && lat >= south && lng <= east && lng >= west;
    }
}

// SubscriptionRequest.java
public class SubscriptionRequest {
    private String type;
    private BoundingBox boundingBox;
    
    // Getters and setters
}

// RoomJoinRequest.java
public class RoomJoinRequest {
    private String routeId;
    private String stopId;
    
    // Getters and setters
}
```

### 2. Configure Socket.IO Server

Create a configuration class for the Socket.IO server:

```java
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    @Value("${socket-server.host}")
    private String host;

    @Value("${socket-server.port}")
    private int port;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin("*"); // Configure CORS as needed
        config.setPingTimeout(60000); // 60 seconds
        config.setPingInterval(25000); // 25 seconds
        
        // For production, you'd want to configure SSL
        // config.setKeyStore(...);
        // config.setKeyStorePassword(...);
        
        return new SocketIOServer(config);
    }
}
```

### 3. Create Socket Event Handlers

Create a service class to handle socket events:

```java
import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SocketService {
    private static final Logger logger = LoggerFactory.getLogger(SocketService.class);

    private final SocketIOServer server;
    
    // Track active bounding box subscriptions
    private final Map<String, BoundingBox> activeBoundingBoxes = new ConcurrentHashMap<>();
    
    public SocketService(SocketIOServer server) {
        this.server = server;
    }

    @PostConstruct
    public void startServer() {
        // Connection event
        server.addConnectListener(onConnected());
        
        // Disconnection event
        server.addDisconnectListener(onDisconnected());
        
        // Map subscription events
        server.addEventListener("subscribe", SubscriptionRequest.class, onSubscribe());
        server.addEventListener("unsubscribe", SubscriptionRequest.class, onUnsubscribe());
        
        // Route room events
        server.addEventListener("join:route", RoomJoinRequest.class, onJoinRoute());
        server.addEventListener("leave:route", RoomJoinRequest.class, onLeaveRoute());
        
        // Stop room events
        server.addEventListener("join:stop", RoomJoinRequest.class, onJoinStop());
        server.addEventListener("leave:stop", RoomJoinRequest.class, onLeaveStop());
        
        // Start the server
        server.start();
        
        logger.info("Socket.IO server started on {}:{}", 
                server.getConfiguration().getHostname(),
                server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stopServer() {
        server.stop();
        logger.info("Socket.IO server stopped");
    }

    private ConnectListener onConnected() {
        return client -> {
            String sessionId = client.getSessionId().toString();
            logger.info("Client connected: {}", sessionId);
        };
    }

    private DisconnectListener onDisconnected() {
        return client -> {
            String sessionId = client.getSessionId().toString();
            logger.info("Client disconnected: {}", sessionId);
            
            // Clean up any subscriptions this client had
            // Implementation depends on how you track subscriptions
        };
    }

    private DataListener<SubscriptionRequest> onSubscribe() {
        return (client, data, ackSender) -> {
            String sessionId = client.getSessionId().toString();
            logger.info("Client {} subscribed to {} in bounding box", 
                    sessionId, data.getType());
            
            // Create a room name using the subscription type and bounding box
            String roomName = String.format("map:%s:%s", 
                    data.getType(), 
                    data.getBoundingBox().toString());
            
            // Join the room
            client.joinRoom(roomName);
            
            // Track the bounding box
            activeBoundingBoxes.put(roomName, data.getBoundingBox());
        };
    }

    private DataListener<SubscriptionRequest> onUnsubscribe() {
        return (client, data, ackSender) -> {
            String roomName = String.format("map:%s:%s", 
                    data.getType(), 
                    data.getBoundingBox().toString());
            
            // Leave the room
            client.leaveRoom(roomName);
            
            // Remove from tracking if no clients left
            if (server.getRoomOperations(roomName).getClients().isEmpty()) {
                activeBoundingBoxes.remove(roomName);
            }
        };
    }

    private DataListener<RoomJoinRequest> onJoinRoute() {
        return (client, data, ackSender) -> {
            if (data.getRouteId() != null) {
                String roomName = "route:" + data.getRouteId();
                client.joinRoom(roomName);
                logger.info("Client {} joined route {}", 
                        client.getSessionId().toString(), 
                        data.getRouteId());
            }
        };
    }

    private DataListener<RoomJoinRequest> onLeaveRoute() {
        return (client, data, ackSender) -> {
            if (data.getRouteId() != null) {
                String roomName = "route:" + data.getRouteId();
                client.leaveRoom(roomName);
            }
        };
    }

    private DataListener<RoomJoinRequest> onJoinStop() {
        return (client, data, ackSender) -> {
            if (data.getStopId() != null) {
                String roomName = "stop:" + data.getStopId();
                client.joinRoom(roomName);
                logger.info("Client {} joined stop {}", 
                        client.getSessionId().toString(), 
                        data.getStopId());
            }
        };
    }

    private DataListener<RoomJoinRequest> onLeaveStop() {
        return (client, data, ackSender) -> {
            if (data.getStopId() != null) {
                String roomName = "stop:" + data.getStopId();
                client.leaveRoom(roomName);
            }
        };
    }

    // Methods for sending updates to clients
    
    public void sendBusLocationUpdate(BusLocationUpdate update) {
        // Send to clients subscribed to this specific route
        String routeRoom = "route:" + update.getRouteId();
        server.getRoomOperations(routeRoom).sendEvent("bus:location", update);
        
        // Also send to clients with geographic subscriptions that include this location
        activeBoundingBoxes.forEach((roomName, box) -> {
            if (roomName.startsWith("map:bus:location:") && 
                    box.containsPoint(update.getLatitude(), update.getLongitude())) {
                server.getRoomOperations(roomName).sendEvent("bus:location", update);
            }
        });
    }
    
    public void sendTrafficUpdate(TrafficUpdate update) {
        // Send to clients with geographic subscriptions that include this area
        activeBoundingBoxes.forEach((roomName, box) -> {
            if (roomName.startsWith("map:traffic:update:") && 
                    box.containsPoint(update.getArea().getCenterLat(), 
                                     update.getArea().getCenterLng())) {
                server.getRoomOperations(roomName).sendEvent("traffic:update", update);
            }
        });
    }
    
    public void sendStopTimesUpdate(StopTimesUpdate update) {
        // Send to clients subscribed to this specific stop
        String stopRoom = "stop:" + update.getStopId();
        server.getRoomOperations(stopRoom).sendEvent("stop:estimated-times", update);
    }
    
    public void sendRouteDelayUpdate(RouteDelayUpdate update) {
        // Send to clients subscribed to this specific route
        String routeRoom = "route:" + update.getRouteId();
        server.getRoomOperations(routeRoom).sendEvent("route:delay", update);
    }
}
```

### 4. Set Up Redis Listeners

Create a service to listen for Redis pub/sub messages and forward them to the socket service:

```java
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.stereotype.Service;

@Service
public class RedisListenerService {

    private final RedisConnectionFactory connectionFactory;
    private final SocketService socketService;
    private final ObjectMapper objectMapper;
    
    public RedisListenerService(
            RedisConnectionFactory connectionFactory,
            SocketService socketService,
            ObjectMapper objectMapper) {
        this.connectionFactory = connectionFactory;
        this.socketService = socketService;
        this.objectMapper = objectMapper;
        
        // Initialize listeners
        setupListeners();
    }
    
    private void setupListeners() {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        
        // Bus location updates
        MessageListenerAdapter busLocationAdapter = new MessageListenerAdapter(new BusLocationMessageListener());
        container.addMessageListener(busLocationAdapter, new ChannelTopic("bus:location"));
        
        // Traffic updates
        MessageListenerAdapter trafficAdapter = new MessageListenerAdapter(new TrafficMessageListener());
        container.addMessageListener(trafficAdapter, new ChannelTopic("traffic:update"));
        
        // Stop times updates
        MessageListenerAdapter stopTimesAdapter = new MessageListenerAdapter(new StopTimesMessageListener());
        container.addMessageListener(stopTimesAdapter, new ChannelTopic("stop:times"));
        
        // Route delay updates
        MessageListenerAdapter routeDelayAdapter = new MessageListenerAdapter(new RouteDelayMessageListener());
        container.addMessageListener(routeDelayAdapter, new ChannelTopic("route:delay"));
        
        container.afterPropertiesSet();
        container.start();
    }
    
    // Inner classes to handle different message types
    
    private class BusLocationMessageListener {
        public void handleMessage(String message) {
            try {
                BusLocationUpdate update = objectMapper.readValue(message, BusLocationUpdate.class);
                socketService.sendBusLocationUpdate(update);
            } catch (Exception e) {
                logger.error("Error processing bus location update", e);
            }
        }
    }
    
    private class TrafficMessageListener {
        public void handleMessage(String message) {
            try {
                TrafficUpdate update = objectMapper.readValue(message, TrafficUpdate.class);
                socketService.sendTrafficUpdate(update);
            } catch (Exception e) {
                logger.error("Error processing traffic update", e);
            }
        }
    }
    
    private class StopTimesMessageListener {
        public void handleMessage(String message) {
            try {
                StopTimesUpdate update = objectMapper.readValue(message, StopTimesUpdate.class);
                socketService.sendStopTimesUpdate(update);
            } catch (Exception e) {
                logger.error("Error processing stop times update", e);
            }
        }
    }
    
    private class RouteDelayMessageListener {
        public void handleMessage(String message) {
            try {
                RouteDelayUpdate update = objectMapper.readValue(message, RouteDelayUpdate.class);
                socketService.sendRouteDelayUpdate(update);
            } catch (Exception e) {
                logger.error("Error processing route delay update", e);
            }
        }
    }
}
```

### 5. Configure Redis

Add Redis configuration:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        
        // Use Jackson serializer for values
        template.setValueSerializer(new Jackson2JsonRedisSerializer<>(Object.class));
        
        return template;
    }
}
```

### 6. Application Properties

Set up your application properties in `application.yml` or `application.properties`:

```yaml
# application.yml
spring:
  application:
    name: bus-tracking-socket-server
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    
socket-server:
  host: ${SOCKET_HOST:0.0.0.0}
  port: ${SOCKET_PORT:8085}

server:
  port: 8080
```

### 7. Dockerization

Create a `Dockerfile` for your Spring Boot application:

```dockerfile
FROM eclipse-temurin:17-jdk as build
WORKDIR /workspace/app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src

RUN ./mvnw package -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

FROM eclipse-temurin:17-jre
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/target/dependency
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","com.yourpackage.BusTrackingSocketApplication"]
```

Create a `docker-compose.yml` file for local development:

```yaml
version: '3.8'

services:
  socket-server:
    build: .
    ports:
      - "8080:8080"  # REST API
      - "8085:8085"  # Socket.IO
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - SOCKET_HOST=0.0.0.0
      - SOCKET_PORT=8085
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

## Testing the Socket Server

You can test the socket server using a simple script:

```javascript
// test-client.js
const io = require('socket.io-client');

const socket = io('http://localhost:8085');

socket.on('connect', () => {
  console.log('Connected to socket server');
  
  // Subscribe to traffic updates
  socket.emit('subscribe', {
    type: 'traffic:update',
    boundingBox: {
      north: 13.1,
      south: 12.8,
      east: 77.8,
      west: 77.4
    }
  });
  
  // Join a route room
  socket.emit('join:route', {
    routeId: 'route-123'
  });
});

socket.on('bus:location', (data) => {
  console.log('Bus location update:', data);
});

socket.on('traffic:update', (data) => {
  console.log('Traffic update:', data);
});

socket.on('connect_error', (err) => {
  console.log('Connection error:', err);
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket server');
});

// Keep the script running
process.stdin.resume();
```

## Publishing Updates to Redis

Here are examples of how to publish updates to Redis that will be picked up by the socket server:

### Bus Location Update
```
PUBLISH bus:location '{"busId":"bus-456","routeId":"route-123","latitude":12.9716,"longitude":77.5946,"heading":45,"speed":25,"nextStopId":"stop-789","estimatedArrival":"5 mins","timestamp":1693420800000}'
```

### Traffic Update
```
PUBLISH traffic:update '{"area":{"centerLat":12.9716,"centerLng":77.5946,"radius":2},"condition":"heavy","delay":15,"cause":"Accident","timestamp":1693420800000}'
```

### Stop Times Update
```
PUBLISH stop:times '{"stopId":"stop-789","buses":[{"busId":"bus-456","routeId":"route-123","routeName":"MG Road Express","estimatedArrival":"5 mins","distance":1.2,"isApproaching":true}],"timestamp":1693420800000}'
```

### Route Delay Update
```
PUBLISH route:delay '{"routeId":"route-123","routeName":"MG Road Express","delayMinutes":10,"reason":"Heavy traffic","affectedStops":["stop-789","stop-790"],"timestamp":1693420800000}'
```

## Production Deployment

For production deployment:

1. Configure proper security:
   - Enable SSL for Socket.IO
   - Set up Redis authentication
   - Configure CORS properly

2. Set up monitoring:
   - Track connected clients
   - Monitor message throughput
   - Set up alerts for server issues

3. Consider scaling:
   - Use multiple socket server instances behind a load balancer
   - Configure sticky sessions or use Redis for session sharing
   - Monitor Redis performance and scale if needed

## Frontend Integration

The frontend is already configured to connect to this socket server. It expects:

- Socket.IO server running on the configured URL (default: http://localhost:8080)
- Events: 'bus:location', 'traffic:update', 'stop:estimated-times', 'route:delay'
- Room-based subscriptions via 'subscribe', 'join:route', and 'join:stop' events

## Troubleshooting

Common issues:

1. **Connection refused**: Ensure the socket server is running and ports are properly exposed in Docker
2. **CORS errors**: Configure proper CORS settings in the socket server
3. **Redis connection failures**: Check Redis connection settings and ensure the service is running
4. **No events received**: Verify that you're publishing to the correct Redis channels and the format matches what the listener expects

## Appendix: Data Format Reference

### Bus Location Update
```json
{
  "busId": "string",
  "routeId": "string",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "heading": 45,
  "speed": 25,
  "nextStopId": "string",
  "estimatedArrival": "string",
  "timestamp": 1693420800000
}
```

### Traffic Update
```json
{
  "area": {
    "centerLat": 12.9716,
    "centerLng": 77.5946,
    "radius": 2,
    "points": [
      {"lat": 12.9, "lng": 77.5},
      {"lat": 13.0, "lng": 77.6}
    ]
  },
  "condition": "light|moderate|heavy",
  "delay": 15,
  "cause": "string",
  "timestamp": 1693420800000
}
```

### Stop Times Update
```json
{
  "stopId": "string",
  "buses": [
    {
      "busId": "string",
      "routeId": "string",
      "routeName": "string",
      "estimatedArrival": "string",
      "distance": 1.2,
      "isApproaching": true
    }
  ],
  "timestamp": 1693420800000
}
```

### Route Delay Update
```json
{
  "routeId": "string",
  "routeName": "string",
  "delayMinutes": 10,
  "reason": "string",
  "affectedStops": ["string"],
  "timestamp": 1693420800000
}
```