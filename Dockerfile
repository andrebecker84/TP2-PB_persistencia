# Build stage
# Java 25 para acompanhar o <java.version> do pom.xml — o TP1 ficou em 21 e a
# imagem não compilaria o projeto.
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# Runtime stage
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
# 18080 acompanha o server.port do application.properties — o TP2 usa um bloco
# de portas próprio para não disputar a 8080 com outros projetos.
EXPOSE 18080
ENTRYPOINT ["java", "-jar", "app.jar"]
