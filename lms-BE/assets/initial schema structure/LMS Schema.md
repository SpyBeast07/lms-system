# LMS V2 documentation
## Summary

- [Introduction](#introduction)
- [Database Type](#database-type)
- [Table Structure](#table-structure)
	- [users](#users)
	- [teacher](#teacher)
	- [student](#student)
	- [course](#course)
	- [student_course](#student_course)
	- [teacher_course](#teacher_course)
	- [learning_material](#learning_material)
	- [notes](#notes)
	- [assignments](#assignments)
	- [questions](#questions)
	- [mcq_options](#mcq_options)
	- [student_assignments](#student_assignments)
	- [student_answers](#student_answers)
	- [teacher_principal_consent](#teacher_principal_consent)
- [Relationships](#relationships)
- [Database Diagram](#database-diagram)

## Introduction

## Database type

- **Database system:** PostgreSQL
## Table structure

### users

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **Id** | INTEGER | 🔑 PK, not null, unique, autoincrement |  | |
| **Name** | TEXT | not null |  | |
| **email** | TEXT | not null, unique |  | |
| **password_hash** | TEXT | not null |  | |
| **role** | ENUM(SUPER_ADMIN,PRINCIPAL,TEACHER,STUDENT) | not null |  | |
| **created_at** | TIMESTAMP | not null |  | | 


### teacher

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **user_id** | INTEGER | 🔑 PK, not null, unique | fk_teacher_user_id_users | |
| **department** | TEXT | null |  | |
| **designation** | TEXT | null |  | | 


### student

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **user_id** | INTEGER | 🔑 PK, not null, unique | fk_student_user_id_users | |
| **roll_number** | INTEGER | not null |  | |
| **class** | VARCHAR | not null |  | | 


### course

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **id** | INTEGER | 🔑 PK, not null, unique, autoincrement |  | |
| **name** | TEXT | not null |  | |
| **description** | TEXT | not null |  | |
| **created_at** | TIMESTAMP | not null |  | | 


### student_course

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **student_id** | INTEGER | not null | fk_student_course_student_id_users | |
| **course_id** | INTEGER | not null | fk_student_course_course_id_course | | 


### teacher_course

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **teacher_id** | INTEGER | not null | fk_teacher_course_teacher_id_users | |
| **course_id** | INTEGER | not null | fk_teacher_course_course_id_course | | 


### learning_material

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **id** | INTEGER | 🔑 PK, not null, unique, autoincrement |  | |
| **course_id** | INTEGER | not null | fk_learning_material_course_id_course | |
| **created_by_teacher_id** | INTEGER | not null | fk_learning_material_created_by_teacher_id_users | |
| **title** | TEXT | not null |  | |
| **type** | ENUM(NOTES,ASSIGNMENT) | not null |  | |
| **created_at** | TIMESTAMP | not null |  | | 


### notes

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **material_id** | INTEGER | 🔑 PK, not null, unique | fk_notes_material_id_learning_material | |
| **content_url** | TEXT | not null |  | | 


### assignments

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **material_id** | INTEGER | 🔑 PK, not null, unique | fk_assignments_material_id_learning_material | |
| **assignment_type** | ENUM(MCQ,LONG) | not null |  | |
| **total_marks** | DECIMAL | not null |  | |
| **due_date** | DATE | not null |  | |
| **max_attempts** | INTEGER | not null, default: 1 |  | | 


### questions

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **id** | INTEGER | 🔑 PK, not null, unique, autoincrement |  | |
| **assignment_id** | INTEGER | not null | fk_questions_assignment_id_assignments | |
| **question_text** | TEXT | not null |  | |
| **question_type** | ENUM(MCQ,LONG) | not null |  | |
| **marks** | DECIMAL | not null |  | | 


### mcq_options

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **id** | INTEGER | 🔑 PK, not null, unique, autoincrement |  | |
| **question_id** | INTEGER | not null | fk_mcq_options_question_id_questions | |
| **option_text** | TEXT | not null |  | |
| **is_correct** | BOOLEAN | not null |  | |
| **answers** | TEXT | not null |  | | 


### student_assignments

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **id** | INTEGER | 🔑 PK, not null, unique, autoincrement |  | |
| **student_id** | INTEGER | not null | fk_student_assignments_student_id_users | |
| **assignment_id** | INTEGER | not null | fk_student_assignments_assignment_id_assignments | |
| **attempt_number** | INTEGER | not null |  | |
| **submitted_at** | TIMESTAMP | null |  | |
| **total_score** | DECIMAL | null |  | |
| **status** | ENUM(SUBMITTED,EVALUATED) | not null |  | | 


### student_answers

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **id** | INTEGER | 🔑 PK, not null, unique, autoincrement |  | |
| **student_assignment_id** | INTEGER | not null | fk_student_answers_student_assignment_id_student_assignments | |
| **question_id** | INTEGER | not null | fk_student_answers_question_id_questions | |
| **answer_text** | TEXT | null |  | |
| **selected_option_id** | INTEGER | null | fk_student_answers_selected_option_id_mcq_options | |
| **marks_obtained** | DECIMAL | null |  | | 


### teacher_principal_consent

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **teacher_id** | INTEGER | not null | fk_teacher_principal_consent_teacher_id_users | |
| **principal_id** | INTEGER | not null | fk_teacher_principal_consent_principal_id_users | |
| **is_granted** | BOOLEAN | not null |  | | 


## Relationships

- **notes to learning_material**: one_to_one
- **teacher to users**: one_to_one
- **student to users**: one_to_one
- **assignments to learning_material**: one_to_one
- **questions to assignments**: many_to_one
- **mcq_options to questions**: many_to_one
- **student_assignments to users**: many_to_one
- **student_assignments to assignments**: many_to_one
- **student_answers to student_assignments**: many_to_one
- **student_answers to questions**: many_to_one
- **student_answers to mcq_options**: many_to_one
- **teacher_principal_consent to users**: one_to_one
- **teacher_principal_consent to users**: many_to_one
- **student_course to users**: one_to_one
- **student_course to course**: many_to_one
- **teacher_course to course**: many_to_one
- **teacher_course to users**: one_to_one
- **learning_material to course**: many_to_one
- **learning_material to users**: many_to_one

## Database Diagram

```mermaid
erDiagram
	notes ||--|| learning_material : references
	teacher ||--|| users : references
	student ||--|| users : references
	assignments ||--|| learning_material : references
	questions }o--|| assignments : references
	mcq_options }o--|| questions : references
	student_assignments }o--|| users : references
	student_assignments }o--|| assignments : references
	student_answers }o--|| student_assignments : references
	student_answers }o--|| questions : references
	student_answers }o--|| mcq_options : references
	teacher_principal_consent ||--|| users : references
	teacher_principal_consent }o--|| users : references
	student_course ||--|| users : references
	student_course }o--|| course : references
	teacher_course }o--|| course : references
	teacher_course ||--|| users : references
	learning_material }o--|| course : references
	learning_material }o--|| users : references

	users {
		INTEGER Id
		TEXT Name
		TEXT email
		TEXT password_hash
		ENUM(SUPER_ADMIN,PRINCIPAL,TEACHER,STUDENT) role
		TIMESTAMP created_at
	}

	teacher {
		INTEGER user_id
		TEXT department
		TEXT designation
	}

	student {
		INTEGER user_id
		INTEGER roll_number
		VARCHAR class
	}

	course {
		INTEGER id
		TEXT name
		TEXT description
		TIMESTAMP created_at
	}

	student_course {
		INTEGER student_id
		INTEGER course_id
	}

	teacher_course {
		INTEGER teacher_id
		INTEGER course_id
	}

	learning_material {
		INTEGER id
		INTEGER course_id
		INTEGER created_by_teacher_id
		TEXT title
		ENUM(NOTES,ASSIGNMENT) type
		TIMESTAMP created_at
	}

	notes {
		INTEGER material_id
		TEXT content_url
	}

	assignments {
		INTEGER material_id
		ENUM(MCQ,LONG) assignment_type
		DECIMAL total_marks
		DATE due_date
		INTEGER max_attempts
	}

	questions {
		INTEGER id
		INTEGER assignment_id
		TEXT question_text
		ENUM(MCQ,LONG) question_type
		DECIMAL marks
	}

	mcq_options {
		INTEGER id
		INTEGER question_id
		TEXT option_text
		BOOLEAN is_correct
		TEXT answers
	}

	student_assignments {
		INTEGER id
		INTEGER student_id
		INTEGER assignment_id
		INTEGER attempt_number
		TIMESTAMP submitted_at
		DECIMAL total_score
		ENUM(SUBMITTED,EVALUATED) status
	}

	student_answers {
		INTEGER id
		INTEGER student_assignment_id
		INTEGER question_id
		TEXT answer_text
		INTEGER selected_option_id
		DECIMAL marks_obtained
	}

	teacher_principal_consent {
		INTEGER teacher_id
		INTEGER principal_id
		BOOLEAN is_granted
	}
```