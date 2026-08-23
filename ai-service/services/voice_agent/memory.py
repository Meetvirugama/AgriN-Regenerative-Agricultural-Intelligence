sessions = {}


def get_session(session_id):

    if session_id not in sessions:

        sessions[session_id] = {
            "conversation": [],
            "current_page": "/dashboard",
            "selected_project": None,
            "last_results": []
        }

    return sessions[session_id]