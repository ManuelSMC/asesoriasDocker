FROM node:22-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
# Try Angular v17+ output first, then fallback to pre-v17
COPY --from=build /app/dist/asesorias-web/browser /usr/share/nginx/html
COPY --from=build /app/dist/asesorias-web /usr/share/nginx/html
COPY ./public/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
