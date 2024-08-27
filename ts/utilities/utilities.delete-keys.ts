export default function deleteKeys<T extends object, K extends keyof T>(obj: T, keysToDelete: K[]): Omit<T, K> {
    const newObj = { ...obj };
    keysToDelete.forEach((key) => {
        delete newObj[key];
    });
    return newObj;
}