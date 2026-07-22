import express from 'express';
import { DocumentModel } from '../models/Document';
import { FlashcardModel } from '../models/Flashcard';
import { QuizAttempt } from '../models/QuizAttempt';
import { StudyPlanModel } from '../models/StudyPlan';
import { ExamAttemptModel } from '../models/ExamAttempt';
import { generatePdf } from '../services/pdfService';
import ejs from 'ejs';

const router = express.Router();

router.get('/documents/:id/summary', async (req, res) => {
    try {
        const doc = await DocumentModel.findById(req.params.id);
        if (!doc || !doc.summary) {
            return res.status(404).json({ error: 'Summary not found' });
        }

        const template = `
            <h1>Summary: <%= filename %></h1>
            <div class="card">
                <h2>Overview</h2>
                <p><%= summary.shortSummary %></p>
            </div>
            <% if (summary.keyPoints && summary.keyPoints.length > 0) { %>
                <div class="card">
                    <h2>Key Points</h2>
                    <ul>
                        <% summary.keyPoints.forEach(function(point) { %>
                            <li><%= point %></li>
                        <% }); %>
                    </ul>
                </div>
            <% } %>
            <% if (summary.definitions && summary.definitions.length > 0) { %>
                <div class="card">
                    <h2>Definitions</h2>
                    <dl>
                        <% summary.definitions.forEach(function(def) { %>
                            <dt class="term"><%= def.term %></dt>
                            <dd><%= def.definition %></dd>
                        <% }); %>
                    </dl>
                </div>
            <% } %>
            <% if (summary.examFocusNotes && summary.examFocusNotes.length > 0) { %>
                <div class="card" style="border-color: #F59E0B; background-color: #FFFBEB;">
                    <h2 style="color: #D97706;">Exam Focus</h2>
                    <ul>
                        <% summary.examFocusNotes.forEach(function(note) { %>
                            <li><%= note %></li>
                        <% }); %>
                    </ul>
                </div>
            <% } %>
        `;

        const html = ejs.render(template, {
            filename: doc.originalFilename,
            summary: doc.summary
        });

        const pdf = await generatePdf(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Summary_${doc.originalFilename}.pdf"`);
        res.send(pdf);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to export PDF' });
    }
});

router.get('/documents/:id/flashcards', async (req, res) => {
    try {
        const doc = await DocumentModel.findById(req.params.id);
        const flashcards = await FlashcardModel.find({ documentId: req.params.id });

        if (!flashcards || flashcards.length === 0) {
            return res.status(404).json({ error: 'No flashcards found for this document' });
        }

        const template = `
            <h1>Flashcards: <%= filename %></h1>
            <% flashcards.forEach(function(fc, i) { %>
                <div class="card" style="page-break-inside: avoid; margin-bottom: 24px;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Card <%= i + 1 %> | Topic: <%= fc.topic %></div>
                    <div style="margin-bottom: 12px;">
                        <strong>Q: </strong> <%= fc.question %>
                    </div>
                    <div style="border-top: 1px dashed #d1d5db; padding-top: 12px; color: #4b5563;">
                        <strong>A: </strong> <%= fc.answer %>
                    </div>
                </div>
            <% }); %>
        `;

        const html = ejs.render(template, {
            filename: doc ? doc.originalFilename : 'Document',
            flashcards
        });

        const pdf = await generatePdf(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Flashcards.pdf"`);
        res.send(pdf);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to export PDF' });
    }
});

router.get('/study-plans/:id', async (req, res) => {
    try {
        const plan = await StudyPlanModel.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ error: 'Study plan not found' });
        }

        const template = `
            <h1>Study Plan</h1>
            <div style="margin-bottom: 24px; color: #4b5563;">
                <strong>Exam Date:</strong> <%= plan.examDate %><br>
                <strong>Target Commitment:</strong> <%= plan.hoursPerDay %> hours/day
            </div>

            <% plan.days.forEach(function(day) { %>
                <div class="card">
                    <h2 style="margin-top: 0;"><%= new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) %></h2>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">Total: <%= day.totalMinutes %> mins</div>

                    <ul style="list-style-type: none; padding-left: 0;">
                        <% day.topics.forEach(function(topic) { %>
                            <li style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                                <div style="display: flex; justify-content: space-between;">
                                    <strong><%= topic.topic %></strong>
                                    <span style="color: #6b7280; font-size: 14px;"><%= topic.minutes %>m</span>
                                </div>
                                <div style="font-size: 12px; margin-top: 4px;">
                                    Priority:
                                    <span style="color: <%= topic.priority === 'high' ? '#DC2626' : (topic.priority === 'medium' ? '#D97706' : '#059669') %>">
                                        <%= topic.priority.toUpperCase() %>
                                    </span>
                                    | Status: <%= topic.completed ? 'Completed' : 'Pending' %>
                                </div>
                            </li>
                        <% }); %>
                    </ul>
                </div>
            <% }); %>
        `;

        const html = ejs.render(template, { plan });
        const pdf = await generatePdf(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="StudyPlan.pdf"`);
        res.send(pdf);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to export PDF' });
    }
});

router.get('/quizzes/:attemptId', async (req, res) => {
    try {
        // Attempt to find it as a regular quiz or an exam mode attempt
        let attempt: any = await QuizAttempt.findById(req.params.attemptId);
        let type = 'Quiz';

        if (!attempt) {
             attempt = await ExamAttemptModel.findById(req.params.attemptId);
             if (attempt) type = 'Exam';
        }

        if (!attempt) {
            return res.status(404).json({ error: 'Attempt not found' });
        }

        const percentage = Math.round((attempt.score / attempt.total) * 100);

        const template = `
            <h1><%= type %> Results</h1>

            <div class="card" style="text-align: center; padding: 32px;">
                <div style="font-size: 48px; font-weight: bold; color: <%= percentage >= 70 ? '#10B981' : (percentage >= 40 ? '#F59E0B' : '#EF4444') %>;">
                    <%= percentage %>%
                </div>
                <div style="color: #6b7280; margin-top: 8px;">
                    Score: <%= attempt.score %> / <%= attempt.total %>
                </div>
            </div>

            <% if (attempt.accuracyByTopic && attempt.accuracyByTopic.length > 0) { %>
                <div class="card">
                    <h2>Topic Performance</h2>
                    <ul>
                        <% attempt.accuracyByTopic.forEach(function(topic) { %>
                            <li>
                                <strong><%= topic.topic %>:</strong>
                                <%= topic.correct %>/<%= topic.total %> (<%= Math.round(topic.accuracy) %>%)
                            </li>
                        <% }); %>
                    </ul>
                </div>
            <% } %>

            <% if (attempt.weakTopics && attempt.weakTopics.length > 0) { %>
                 <div class="card" style="border-color: #EF4444; background-color: #FEF2F2;">
                    <h2 style="color: #B91C1C;">Areas for Improvement</h2>
                    <ul>
                        <% attempt.weakTopics.forEach(function(wt) { %>
                            <li><%= wt %></li>
                        <% }); %>
                    </ul>
                </div>
            <% } %>

            <h2>Detailed Review</h2>
            <% attempt.results.forEach(function(result, i) { %>
                <div class="card" style="border-left: 4px solid <%= result.correct ? '#10B981' : '#EF4444' %>;">
                    <div style="font-weight: bold; margin-bottom: 8px;">
                        Question <%= i + 1 %>
                        <span style="color: <%= result.correct ? '#10B981' : '#EF4444' %>; margin-left: 8px;">
                            <%= result.correct ? '✓ Correct' : '✗ Incorrect' %>
                        </span>
                    </div>
                    <% if (attempt.answers[i]) { %>
                        <div style="color: #4b5563; margin-bottom: 8px;">
                            Your Answer: <em><%= attempt.answers[i].answer %></em>
                        </div>
                    <% } %>
                    <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 14px;">
                        <strong>Explanation:</strong> <%= result.explanation %>
                    </div>
                </div>
            <% }); %>
        `;

        const html = ejs.render(template, { attempt, type, percentage });
        const pdf = await generatePdf(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${type}Results.pdf"`);
        res.send(pdf);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Failed to export PDF' });
    }
});

export default router;
