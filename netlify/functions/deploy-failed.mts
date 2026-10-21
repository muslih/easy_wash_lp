// Dipanggil otomatis oleh Netlify setiap deploy gagal.
import { notifyDeploy } from './notify';

export const handler = async (event: { body: string | null }) => {
  await notifyDeploy(event.body, false);
  return { statusCode: 200, body: 'ok' };
};
