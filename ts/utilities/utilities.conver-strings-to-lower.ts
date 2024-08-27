export default function convertStringsToLower<T extends Record<string, any>, K extends Extract<keyof T, string>>(obj: T, ignoreKeys: K[] = []): T {
    const newObj: any = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];

            if (typeof value === 'string' && !ignoreKeys.includes(key as K)) {
                newObj[key] = value.toLowerCase();
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                newObj[key] = convertStringsToLower(value, ignoreKeys);
            } else {
                newObj[key] = value;
            }
        }
    }

    return newObj;
}
