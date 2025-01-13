 tinymce.init({ 
            selector: '#editor',
			plugins: 'codesample lists link image table code help wordcount',			
			toolbar:
    "codesample | code | media | undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link | image",
            entity_encoding: 'raw' // Prevents encoding of HTML entities
        });

        document.addEventListener('DOMContentLoaded', function () {
            let categories = []; // Global array to store categories
			fetchNotes();
			fetchCategories();

            document.getElementById('save-note').addEventListener('click', function () {
                const noteId = document.getElementById('note-id').value;
                const content = tinymce.get('editor').getContent(); 
				const categoryId = document.getElementById('category-select').value;
					saveNote(noteId, content, categoryId);
            });

            document.getElementById('new-note').addEventListener('click', function () {
                document.getElementById('note-id').value = '';
                tinymce.get('editor').setContent('');
				 document.getElementById('category-select').value = '';
            });
			
			document.getElementById('add-category').addEventListener('click', function () {
				const categoryName = document.getElementById('new-category').value;
				addCategory(categoryName);
			});
        });

        function fetchNotes() {
            fetch('index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'fetch' })
            })
            .then(response => response.json())
            .then(notes => {
                const container = document.getElementById('notes-container');
                container.innerHTML = '';
                notes.forEach(note => {
                    const div = document.createElement('div');
                    div.classList.add('note');
                    div.classList.add('bg-body-tertiary');
                    div.innerHTML = `<div class="category alert alert-danger"><strong>Category:</strong> ${note.category_name || 'None'}</div><div class="note-content p-3">${note.content}</div>
                        <button class="btn btn-secondary rounded-pill px-3" data-id="${note.id}" 
                        data-content="${encodeURIComponent(note.content)}" 
                        onclick="editNote(this)"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg> Edit</button>
						 <button class="btn btn-danger rounded-pill px-3" onclick="deleteNote(${note.id})"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/></svg> Delete</button>
                    `;
                    container.appendChild(div);
                });
            });
        }
		
		   function fetchCategories() {
				fetch('index.php', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({ action: 'fetch_categories' })
				})
				.then(response => response.json())
				.then(data => {
					categories = data; // Store categories globally
					const select = document.getElementById('category-select');
					select.innerHTML = '<option value="">Select Category</option>';
					categories.forEach(category => {
						const option = document.createElement('option');
						option.value = category.id;
						option.textContent = category.name;
						select.appendChild(option);
					});
				});
			}

        function saveNote(noteId, content, categoryId) {
            fetch('index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'save', note_id: noteId, content, category_id: categoryId })
            })
            .then(response => response.text())
            .then(() => {
                fetchNotes();
                document.getElementById('new-note').click();
            });
        }
		 function deleteNote(noteId) {
            if (confirm('Are you sure you want to delete this note?')) {
                fetch('index.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ action: 'delete', note_id: noteId })
                })
                .then(response => response.text())
                .then(result => {
                    if (result === 'success') {
                        fetchNotes();
                    } else {
                        alert('Error deleting note');
                    }
                });
            }
        }
		
		

       let activeEditor = null; // Track the active editor instance

			function editNote(button) {
				const noteId = button.getAttribute('data-id');
				const content = decodeURIComponent(button.getAttribute('data-content'));

				// Destroy the previous editor if one exists
				if (activeEditor) {
					tinymce.remove(activeEditor);
					activeEditor = null;
				}

				// Replace note content with a TinyMCE editor
				const noteDiv = button.closest('.note');
				const noteContentDiv = noteDiv.querySelector('.note-content');

				noteContentDiv.innerHTML = `<textarea id="editor-${noteId}">${content}</textarea>`;
				tinymce.init({
					selector: `#editor-${noteId}`,
					plugins: 'codesample lists link image table code help wordcount',
					toolbar:
						"codesample | code | media | undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | link | image",
					setup: (editor) => {
						activeEditor = editor;
					}
				});

				// Add Save/Cancel buttons
				const actionDiv = document.createElement('div');
				actionDiv.innerHTML = `
					<button class="btn btn-primary rounded-pill px-3" onclick="saveEditedNote(${noteId})">Save</button>
					<button class="btn btn-secondary rounded-pill px-3" onclick="cancelEdit(${noteId}, '${encodeURIComponent(content)}')">Cancel</button>
				`;
				noteDiv.appendChild(actionDiv);
			}
function saveEditedNote(noteId) {
    const editor = tinymce.get(`editor-${noteId}`);
    const updatedContent = editor.getContent();

    fetch('index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'save', note_id: noteId, content: updatedContent })
    })
    .then(() => {
        fetchNotes(); // Refresh notes
    });
}
function cancelEdit(noteId, originalContent) {
    const noteDiv = document.querySelector(`#editor-${noteId}`).closest('.note');
    const noteContentDiv = noteDiv.querySelector('.note-content');

    // Restore the original content
    noteContentDiv.innerHTML = decodeURIComponent(originalContent);

    // Remove TinyMCE instance if active
    if (activeEditor) {
        tinymce.remove(activeEditor);
        activeEditor = null;
    }

    // Remove Save/Cancel buttons
    const actionDiv = noteDiv.querySelector('div:last-child');
    actionDiv.remove();
}
function addCategory(categoryName) {
            fetch('index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'add_category', category_name: categoryName })
            })
            .then(() => {
                fetchCategories();
                document.getElementById('new-category').value = '';
            });
        }