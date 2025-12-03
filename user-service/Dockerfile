FROM eclipse-temurin:17-jre as runtime
WORKDIR /app
COPY target/user-service-0.0.1-SNAPSHOT.jar /app/app.jar
ENV JAVA_OPTS=""
EXPOSE 8087
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
