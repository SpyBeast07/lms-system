from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Literal

class PostReplyBase(BaseModel):
    content: str

class PostReplyCreate(PostReplyBase):
    parent_reply_id: Optional[int] = None

class PostReplyRead(PostReplyBase):
    id: int
    post_id: int
    author_id: int
    parent_reply_id: Optional[int]
    created_at: datetime
    author_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CoursePostBase(BaseModel):
    title: str
    content: str
    type: Literal['ANNOUNCEMENT', 'DISCUSSION', 'QUESTION']
    is_pinned: bool = False

class CoursePostCreate(CoursePostBase):
    pass

class CoursePostRead(CoursePostBase):
    id: int
    course_id: int
    school_id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class CoursePostWithReplies(CoursePostRead):
    replies: List[PostReplyRead] = []
