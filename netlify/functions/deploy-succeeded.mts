// Dipanggil otomatis oleh Netlify setiap deploy berhasil.
import { notifyDeploy } from './notify';

export const handler = async (event: { body: string | null }) => {
  await notifyDeploy(event.body, true);
  return { statusCode: 200, body: 'ok' };
};
