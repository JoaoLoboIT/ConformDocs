export function notFoundMiddleware(request, response) {
  return response.status(404).render("errors/404", {
    title: "Página não encontrada",
    requestedPath: request.originalUrl,
  });
}
