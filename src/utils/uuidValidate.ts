import { validate as uuidValidate } from 'uuid';
export const uuidValidateV4 = (uuid: string) => {
  return uuidValidate(uuid);
};
