import {MemoryFileSystem} from "kissfs";
import {Entries, Status} from "../../src/excalibur/entries";
import {User} from "../../src/session/users";
import {ExcaliburSecClass} from "../../src/excalibur/clearence";
import {expect} from 'chai';


function makeUser(clearence: ExcaliburSecClass): User {
    const result = new User({
        gender: "ADVANCED",
        name: "jane joe",
        key: 'j',
        excaliburClearance: "CONFIDENTIAL"
    });
    result.excaliburClearance = clearence;
    return result;
}

function makeEntryFile(status: Status, securityClass: ExcaliburSecClass, name: string, content: string) {
    return `---
status : ${status}
securityClass : ${securityClass}
name : ${name}
---
${content}`;
}

describe.only('excalibur module', () => {
    describe('init', () => {
        it('on empty file sytsem - throws', async () => {
            const fs: MemoryFileSystem = new MemoryFileSystem();
            const entries = new Entries(fs);
            try {
                await entries.init();
                expect.fail(null, 'Error', 'expected init to throw')
            } catch (e) {
            }
        });

        it('on non-empty file sytsem - passes', async () => {
            const fs: MemoryFileSystem = new MemoryFileSystem();
            await fs.saveFile('entries/foo.md', '');
            const entries = new Entries(fs);
            await entries.init();
        });

    });

    describe('open', () => {
        describe('pre-existing file', () => {

            async function makeEntriesWithPreExistingFile(fileContent: string) {
                const fs: MemoryFileSystem = new MemoryFileSystem();
                await fs.saveFile('entries/zagzag.md', fileContent);
                const entries = new Entries(fs);
                await entries.init();
                return entries;
            }

            it('does not find draft file', async () => {
                const entries = await makeEntriesWithPreExistingFile(makeEntryFile(Status.DRAFT, ExcaliburSecClass.CONFIDENTIAL, 'foo', 'bar'));
                const result = entries.open(makeUser(ExcaliburSecClass.CONFIDENTIAL), 'foo');
                expect(result).to.not.be.ok;
            });

            it('does not find query file', async () => {
                const entries = await makeEntriesWithPreExistingFile(makeEntryFile(Status.QUERY, ExcaliburSecClass.CONFIDENTIAL, 'foo', 'bar'));
                const result = entries.open(makeUser(ExcaliburSecClass.CONFIDENTIAL), 'foo');
                expect(result).to.not.be.ok;
            });

            it('finds entry file', async () => {
                const entries = await makeEntriesWithPreExistingFile(makeEntryFile(Status.ENTRY, ExcaliburSecClass.CONFIDENTIAL, 'foo', 'bar'));
                const result = entries.open(makeUser(ExcaliburSecClass.CONFIDENTIAL), 'foo');
                expect(result).to.eql('bar');
            });

            it('finds entry with whitespace before metadata', async () => {
                const entries = await makeEntriesWithPreExistingFile('\n  \t  ' + makeEntryFile(Status.ENTRY, ExcaliburSecClass.CONFIDENTIAL, 'foo', 'bar'));
                const result = entries.open(makeUser(ExcaliburSecClass.CONFIDENTIAL), 'foo');
                expect(result).to.eql('bar');
            });

            it('finds entry by case-insensitive name', async () => {
                const entries = await makeEntriesWithPreExistingFile(makeEntryFile(Status.ENTRY, ExcaliburSecClass.CONFIDENTIAL, 'FoO', 'bar'));
                const result = entries.open(makeUser(ExcaliburSecClass.CONFIDENTIAL), 'fOo');
                expect(result).to.eql('bar');
            });
        });
    });
});
