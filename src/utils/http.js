export function redirectWithMessage(response, path, message, type = "success") {
  const separator = path.includes("?") ? "&" : "?";
  return response.redirect(
    `${path}${separator}${type}=${encodeURIComponent(message)}`,
  );
}
