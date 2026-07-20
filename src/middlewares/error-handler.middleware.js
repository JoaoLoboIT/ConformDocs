export function errorHandlerMiddleware(error, request, response, next) {
  console.error(error);

  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  return response.status(statusCode).render("errors/500", {
    title: statusCode === 404 ? "Registro não encontrado" : "Erro interno",
    statusCode,
    errorMessage:
      statusCode >= 500
        ? "Não foi possível concluir a operação. Verifique os terminais da aplicação e do MongoDB."
        : error.message,
  });
}
