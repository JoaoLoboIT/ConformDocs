export function showHomePage(request, response) {
    return response.render("home", {
        title: "ConformDocs"
    });
}