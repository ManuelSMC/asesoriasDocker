FROM eclipse-temurin:17-jre as runtime
WORKDIR /app
COPY target/eureka-server-0.0.1-SNAPSHOT.jar /app/app.jar
ENV JAVA_OPTS=""
EXPOSE 8761
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
