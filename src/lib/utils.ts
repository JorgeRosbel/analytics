import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { stn, type HttpStatusCode } from 'http-sentinel';
import { ZodError } from 'zod';
import axios from 'axios';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function requestWrapper<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      stn.throw.UnprocessableEntity(error.message);
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status as HttpStatusCode;
      if (status) {
        stn.tools.resolveHttpError(status);
      }
    }
    stn.throw.UnknownError('Se produjo un error desconocido :(');
  }
}
