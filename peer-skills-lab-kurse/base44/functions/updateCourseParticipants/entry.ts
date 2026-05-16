import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const peerskillslab = createClientFromRequest(req);

    const { course_id, increment } = await req.json();

    if (!course_id) {
      return Response.json({ error: 'course_id is required' }, { status: 400 });
    }

    // Use service role to update participant count
    const course = await peerskillslab.asServiceRole.entities.Course.get(course_id);
    
    if (!course) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    const newCount = Math.max(0, (course.current_participants || 0) + (increment || 1));

    await peerskillslab.asServiceRole.entities.Course.update(course_id, {
      current_participants: newCount,
    });

    // Return success with new count - frontend will handle query invalidation
    return Response.json({ 
      success: true, 
      course_id: course_id, 
      current_participants: newCount 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});