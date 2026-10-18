# syntax=docker/dockerfile:1

# ---------------------------------------------------------------
# Stage 1 - build the Spring Boot jar
# The Maven wrapper is used so the build matches local development.
# ---------------------------------------------------------------
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace

# Copy only what is needed to resolve dependencies first, so this layer
# stays cached for as long as pom.xml is unchanged.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

# Sources change on every commit, so they come after dependency resolution.
COPY src/ src/
RUN ./mvnw -B -DskipTests package

# Split the fat jar into layers so Docker caches dependencies separately
# from application classes (Spring Boot 3.3+ / 4.x "tools" jarmode).
RUN java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination extracted

# ---------------------------------------------------------------
# Stage 2 - minimal runtime image (JRE only, no build tooling)
# ---------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as an unprivileged user.
RUN useradd --system --uid 1001 --create-home spring
USER spring

# Order matters: least -> most frequently changing.
COPY --from=build --chown=spring:spring /workspace/extracted/dependencies/ ./
COPY --from=build --chown=spring:spring /workspace/extracted/spring-boot-loader/ ./
COPY --from=build --chown=spring:spring /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build --chown=spring:spring /workspace/extracted/application/ ./

# There is no Docker daemon inside the container, so the Spring Boot
# compose integration must never try to start compose.yaml.
ENV DOCKER_COMPOSE_ENABLED=false
# Respect the container memory limit (Render free tier is 512 MB).
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC"

# Informational only - the platform injects PORT at runtime.
EXPOSE 8085

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]

