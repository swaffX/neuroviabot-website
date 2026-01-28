const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class ModerationNote {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.guildId = data.guildId;
        this.userId = data.userId;
        this.moderatorId = data.moderatorId;
        this.note = data.note;
        this.type = data.type || 'note'; // 'note', 'warning', 'info'
        this.severity = data.severity || 'low'; // 'low', 'medium', 'high', 'critical'
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.attachments = data.attachments || []; // URLs to screenshots/evidence
        this.relatedCaseId = data.relatedCaseId || null; // Link to moderation case
    }

    generateId() {
        return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static async create(guildId, userId, moderatorId, note, options = {}) {
        try {
            const db = getDatabase();
            
            if (!db.data.moderationNotes) {
                db.data.moderationNotes = new Map();
            }

            const noteData = new ModerationNote({
                guildId,
                userId,
                moderatorId,
                note,
                type: options.type || 'note',
                severity: options.severity || 'low',
                attachments: options.attachments || [],
                relatedCaseId: options.relatedCaseId || null
            });

            db.data.moderationNotes.set(noteData.id, noteData);
            db.save();

            logger.info(`[ModerationNote] Created note ${noteData.id} for user ${userId}`);
            return noteData;

        } catch (error) {
            logger.error('[ModerationNote] Error creating note:', error);
            throw error;
        }
    }

    static async getByUser(guildId, userId) {
        try {
            const db = getDatabase();
            
            if (!db.data.moderationNotes) {
                return [];
            }

            const notes = [];
            for (const [id, note] of db.data.moderationNotes) {
                if (note.guildId === guildId && note.userId === userId) {
                    notes.push(note);
                }
            }

            // Sort by createdAt (newest first)
            notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return notes;

        } catch (error) {
            logger.error('[ModerationNote] Error getting user notes:', error);
            return [];
        }
    }

    static async getById(noteId) {
        try {
            const db = getDatabase();
            
            if (!db.data.moderationNotes) {
                return null;
            }

            return db.data.moderationNotes.get(noteId) || null;

        } catch (error) {
            logger.error('[ModerationNote] Error getting note by ID:', error);
            return null;
        }
    }

    static async update(noteId, updates) {
        try {
            const db = getDatabase();
            
            if (!db.data.moderationNotes || !db.data.moderationNotes.has(noteId)) {
                throw new Error('Note not found');
            }

            const note = db.data.moderationNotes.get(noteId);
            
            // Update allowed fields
            if (updates.note !== undefined) note.note = updates.note;
            if (updates.type !== undefined) note.type = updates.type;
            if (updates.severity !== undefined) note.severity = updates.severity;
            if (updates.attachments !== undefined) note.attachments = updates.attachments;
            
            note.updatedAt = new Date().toISOString();

            db.data.moderationNotes.set(noteId, note);
            db.save();

            logger.info(`[ModerationNote] Updated note ${noteId}`);
            return note;

        } catch (error) {
            logger.error('[ModerationNote] Error updating note:', error);
            throw error;
        }
    }

    static async delete(noteId) {
        try {
            const db = getDatabase();
            
            if (!db.data.moderationNotes || !db.data.moderationNotes.has(noteId)) {
                throw new Error('Note not found');
            }

            db.data.moderationNotes.delete(noteId);
            db.save();

            logger.info(`[ModerationNote] Deleted note ${noteId}`);
            return true;

        } catch (error) {
            logger.error('[ModerationNote] Error deleting note:', error);
            throw error;
        }
    }

    static async search(guildId, filters = {}) {
        try {
            const db = getDatabase();
            
            if (!db.data.moderationNotes) {
                return [];
            }

            let notes = [];
            for (const [id, note] of db.data.moderationNotes) {
                if (note.guildId === guildId) {
                    notes.push(note);
                }
            }

            // Apply filters
            if (filters.userId) {
                notes = notes.filter(n => n.userId === filters.userId);
            }
            if (filters.moderatorId) {
                notes = notes.filter(n => n.moderatorId === filters.moderatorId);
            }
            if (filters.type) {
                notes = notes.filter(n => n.type === filters.type);
            }
            if (filters.severity) {
                notes = notes.filter(n => n.severity === filters.severity);
            }
            if (filters.startDate) {
                notes = notes.filter(n => new Date(n.createdAt) >= new Date(filters.startDate));
            }
            if (filters.endDate) {
                notes = notes.filter(n => new Date(n.createdAt) <= new Date(filters.endDate));
            }

            // Sort by createdAt (newest first)
            notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return notes;

        } catch (error) {
            logger.error('[ModerationNote] Error searching notes:', error);
            return [];
        }
    }

    static async getStats(guildId) {
        try {
            const db = getDatabase();
            
            if (!db.data.moderationNotes) {
                return {
                    total: 0,
                    byType: {},
                    bySeverity: {},
                    recentCount: 0
                };
            }

            const notes = [];
            for (const [id, note] of db.data.moderationNotes) {
                if (note.guildId === guildId) {
                    notes.push(note);
                }
            }

            const stats = {
                total: notes.length,
                byType: {},
                bySeverity: {},
                recentCount: 0
            };

            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            notes.forEach(note => {
                // Count by type
                stats.byType[note.type] = (stats.byType[note.type] || 0) + 1;
                
                // Count by severity
                stats.bySeverity[note.severity] = (stats.bySeverity[note.severity] || 0) + 1;
                
                // Count recent (last 7 days)
                if (new Date(note.createdAt) >= weekAgo) {
                    stats.recentCount++;
                }
            });

            return stats;

        } catch (error) {
            logger.error('[ModerationNote] Error getting stats:', error);
            return {
                total: 0,
                byType: {},
                bySeverity: {},
                recentCount: 0
            };
        }
    }
}

module.exports = ModerationNote;

