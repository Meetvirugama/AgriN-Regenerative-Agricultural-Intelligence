def has_permission(page: str) -> bool:
    return True



PAGES = {
    "dashboard": "/dashboard",
    "profile": "/profile",
    "projects": "/projects",
    "analytics": "/analytics",
    "settings": "/settings",
    "orders": "/orders",
    "messages": "/messages"
}


def navigate_to_page(page):

    # Does page exist?
    if page not in PAGES:
        return {
            "success": False,
            "reason": "PAGE_NOT_FOUND"
        }

    # Permission check
    if not has_permission(page):
        return {
            "success": False,
            "reason": "PERMISSION_DENIED"
        }

    return {
        "success": True,
        "action": "NAVIGATE",
        "page": page,
        "path": PAGES[page]
    }