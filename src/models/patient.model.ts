import { prisma } from './database';
import { Patient } from '../types';

export class PatientModel {
  static async create(data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    const now = new Date().toISOString();

    const patient = await prisma.patient.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapPrismaToPatient(patient);
  }

  static async findById(id: string): Promise<Patient | undefined> {
    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) return undefined;
    return this.mapPrismaToPatient(patient);
  }

  static async findByEmail(email: string): Promise<Patient | undefined> {
    const patient = await prisma.patient.findUnique({
      where: { email },
    });

    if (!patient) return undefined;
    return this.mapPrismaToPatient(patient);
  }

  static async findAll(): Promise<Patient[]> {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return patients.map(this.mapPrismaToPatient);
  }

  static async update(
    id: string,
    data: Partial<Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Patient | undefined> {
    try {
      const patient = await prisma.patient.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
          updatedAt: new Date().toISOString(),
        },
      });

      return this.mapPrismaToPatient(patient);
    } catch (error: any) {
      if (error.code === 'P2025') {
        // 4040
        return undefined;
      }
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.patient.delete({
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

  private static mapPrismaToPatient(patient: any): Patient {
    return {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone || undefined,
      dateOfBirth: patient.dateOfBirth || undefined,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}
