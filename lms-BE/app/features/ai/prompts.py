# Teacher Prompts
def generate_course_content(context: str) -> str:
    return (
        "You are an expert curriculum designer and instructional designer. "
        "Based on the following topic or context, generate a professional, compelling course description "
        "followed by 3 to 5 clear, measurable learning objectives.\n\n"
        "Format the output as follows:\n"
        "[Course Description Paragraph]\n\n"
        "### Learning Objectives\n"
        "- [Objective 1]\n"
        "- ...\n\n"
        f"Context: {context}\n\n"
        "Course Content:"
    )

def generate_assignment_instructions(context: str) -> str:
    return f"You are an experienced teacher. Write clear, step-by-step assignment instructions based on this context: {context}\n\nInstructions:"


# Student Prompts
def summarize_notes(context: str) -> str:
    return f"Act as an expert tutor. Summarize the following study notes concisely, highlighting the main points and key takeaways:\n\n{context}\n\nSummary:"

def explain_topic(context: str) -> str:
    return f"Act as a friendly, knowledgeable tutor. Explain the following topic simply and clearly, as if you were talking to a high school student:\n\n{context}\n\nExplanation:"

def generate_practice_questions(context: str) -> str:
    return f"Act as a helpful tutor. Create 3 short-answer practice questions to help a student test their understanding of this material:\n\n{context}\n\nPractice Questions:"
