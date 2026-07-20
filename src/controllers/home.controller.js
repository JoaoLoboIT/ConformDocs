import { getDashboardData } from "../services/dashboard.service.js";

export async function showHomePage(request, response, next) {
  try {
    const dashboard = await getDashboardData();
    return response.render("home", {
      title: "Dashboard",
      dashboard,
    });
  } catch (error) {
    return next(error);
  }
}
