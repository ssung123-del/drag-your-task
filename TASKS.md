# Task: Fix Korean IME Duplication Bug

## Problem
The user is experiencing a "duplicate character" bug when typing Korean (Hangul). This typically occurs in React controlled components (`value` linked to `state`) where re-renders interfere with the browser's IME composition process, causing characters to be committed twice (e.g., typing '안' results in 'ㅇ안' or '아안').

## Objective
Refactor the text input handling to prevent IME interference. The most robust solution is to switch from a **Controlled Component** (updating state on every keystroke) to an **Uncontrolled Component** (using `ref` or `defaultValue`), or strictly managing the composition state.

Given the context, the `DetailModal` in `src/components/DragDropBoard.tsx` uses a standard controlled `textarea`. We will convert this to an uncontrolled component using `useRef` to completely bypass the re-render cycle during typing.

## Instructions for Opencode Agent

### 1. Refactor `DetailModal` in `src/components/DragDropBoard.tsx`
   - **Locate**: The `DetailModal` component.
   - **Change**:
     - Remove the `content` state (`const [content, setContent] = useState(...)`).
     - Create a ref: `const textareaRef = useRef<HTMLTextAreaElement>(null);`.
     - Update the `<textarea>`:
       - Remove `value={content}`.
       - Remove `onChange={(e) => setContent(...)}`.
       - Add `ref={textareaRef}`.
       - Add `defaultValue={initialContent || ''}`.
   - **Update `handleSubmit`**:
     - Instead of reading the `content` state, read the value directly from the ref:
       ```typescript
       const finalContent = textareaRef.current?.value || '';
       // Use finalContent and selectedSubType to call onConfirm
       ```

### 2. Verify `EntryForm.tsx` (Safety Check)
   - `EntryForm` uses `react-hook-form` (`register`), which is inherently uncontrolled and usually safe for IME.
   - **Action**: Check `src/components/EntryForm.tsx`.
   - Ensure `handleSubmit` properly handles the submission.
   - If there are any explicit `value` props or manual `onChange` handlers mixed with `register`, remove them or ensure they don't force re-renders. (Likely no change needed here, but verify).

### 3. Summary
   - The primary fix is identifying the controlled `textarea` in the modal and detaching it from React's render loop by using a Ref. This is the standard "silver bullet" for Korean IME issues in React modals.
