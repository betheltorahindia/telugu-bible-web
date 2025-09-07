export type Verse = { bnumber: number; cnumber: number; vnumber: number; text: string };
export type Chapter = { cnumber: number; verses: Verse[] };
export type Book = { bnumber: number; bname: string; chapters: Chapter[] };
export type Bible = { books: Book[] };

export type AliyahRef = { b: number; c: number; v: number }; // book, chapter, verse
export type Parasha = { name: string; book: number; aliyot: AliyahRef[] }; // 7 aliyot
