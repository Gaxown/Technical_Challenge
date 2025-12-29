import { prisma } from './database';
import { VoiceNote } from '../types';

export class VoiceNoteModel {
  static async create(data: Omit<VoiceNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<VoiceNote> {
    const now = new Date().toISOString();

    const voiceNote = await prisma.voiceNote.create({
      data: {
        patientId: data.patientId,
        title: data.title,
        duration: data.duration,
        recordedAt: data.recordedAt,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapPrismaToVoiceNote(voiceNote);
  }

  static async findById(id: string): Promise<VoiceNote | undefined> {
    const voiceNote = await prisma.voiceNote.findUnique({
      where: { id },
    });

    if (!voiceNote) return undefined;
    return this.mapPrismaToVoiceNote(voiceNote);
  }

  static async findByPatientId(patientId: string): Promise<VoiceNote[]> {
    const voiceNotes = await prisma.voiceNote.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
    });

    return voiceNotes.map(this.mapPrismaToVoiceNote);
  }

  static async findAll(): Promise<VoiceNote[]> {
    const voiceNotes = await prisma.voiceNote.findMany({
      orderBy: { recordedAt: 'desc' },
    });

    return voiceNotes.map(this.mapPrismaToVoiceNote);
  }

  static async update(
    id: string,
    data: Partial<Omit<VoiceNote, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>>
  ): Promise<VoiceNote | undefined> {
    try {
      const voiceNote = await prisma.voiceNote.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.metadata !== undefined && { metadata: JSON.stringify(data.metadata) }),
          updatedAt: new Date().toISOString(),
        },
      });

      return this.mapPrismaToVoiceNote(voiceNote);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return undefined;
      }
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.voiceNote.delete({
        where: { id },
      });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  private static mapPrismaToVoiceNote(voiceNote: any): VoiceNote {
    return {
      id: voiceNote.id,
      patientId: voiceNote.patientId,
      title: voiceNote.title,
      duration: voiceNote.duration,
      recordedAt: voiceNote.recordedAt,
      metadata: voiceNote.metadata ? JSON.parse(voiceNote.metadata) : undefined,
      createdAt: voiceNote.createdAt,
      updatedAt: voiceNote.updatedAt,
    };
  }
}
