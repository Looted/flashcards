# DeepSeek V3 Optimization Rules
1. **No Laziness**: Never use comments like "// ... rest of code ..." or "// ... existing code ...". ALways rewrite the full file content when editing.
2. **Tool Use**: You have tools for file creation and editing. Use them directly rather than asking for permission.
3. **Context**: If you are unsure about a file's content, use `read_file` first. Do not guess.
4. **Format**: When using `deepseek-reasoner`, output ONLY the final solution in the response. The thinking process is internal.
