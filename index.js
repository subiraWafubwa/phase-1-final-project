const email = localStorage.getItem('globalEmail');
document.addEventListener('DOMContentLoaded', async () => {
    const addNoteButton = document.getElementById('add-note');
    addNoteButton.addEventListener('click', addCard);
    await getNotes();
});
// Function to generate a unique ID
function generateUniqueId() {
    return '_' + Math.random().toString(36);
}

function addCard() {
    // Remove existing note form if any
    const existingForm = document.querySelector('.note-form');
    if (existingForm) {
        existingForm.remove();
    }

    // Create the form container
    const formContainer = document.createElement('div');
    formContainer.className = 'note-form';

    // Create the title input
    const titleInput = document.createElement('input');
    titleInput.id = 'title-input';
    titleInput.type = 'text';
    titleInput.placeholder = 'Note Title';

    // Create the Quill editor container
    const editorContainer = document.createElement('div');
    editorContainer.id = 'quill-editor';
    editorContainer.style.height = '200px';
    editorContainer.style.fontSize = '20px';

    // Create the save button
    const saveButton = document.createElement('button');
    saveButton.id = 'save-button';
    saveButton.textContent = 'Save';
    saveButton.style.marginTop = '10px';
    saveButton.style.float = 'right';

    // Create the cancel button
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-button';
    cancelButton.style.backgroundColor = 'rgb(239, 0, 0)';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.marginTop = '10px';
    cancelButton.style.float = 'left';

    // Append elements to form container
    formContainer.appendChild(titleInput);
    formContainer.appendChild(editorContainer);
    formContainer.appendChild(cancelButton);
    formContainer.appendChild(saveButton);

    // Append form container to the body
    document.body.appendChild(formContainer);

    // Initialize Quill editor
    new Quill('#quill-editor', {
        theme: 'snow'
    });

    // Handle cancel button click
    cancelButton.addEventListener('click', () => {
        formContainer.remove();
    });

    // Handle save button click
    saveButton.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const content = document.querySelector('#quill-editor .ql-editor').innerHTML;

        if (title === '' || content === '') {
            alert('All fields are required');
            return;
        }

        // Fetch the user ID based on the email
        let userID;
        try {
            const userResponse = await fetch(`http://localhost:3000/api/user-id/${encodeURIComponent(email)}`);
            const userResult = await userResponse.json();

            if (userResponse.ok) {
                userID = userResult.userID;
            } else {
                alert(userResult.message || 'Error fetching user ID');
                return;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching user ID');
            return;
        }

        // Create the note object with a unique ID
        const note = {
            _id: generateUniqueId(), // Assign a unique ID
            title,
            content,
            createdAt: new Date().toISOString()
        };

        // Make POST request to save note
        try {
            const response = await fetch('http://localhost:3000/api/post-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userID, note })
            });

            const result = await response.json();

            if (response.ok) {
                // Close the form
                formContainer.remove();
                await getNotes(); // Refresh the notes list
            } else {
                alert(result.message || 'An error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }

        formContainer.remove();
    });
}

async function editNote(noteId, existingTitle, existingContent, createdAt) {
    // Remove existing note form if any
    const existingForm = document.querySelector('.note-form');
    if (existingForm) {
        existingForm.remove();
    }

    // Create the form container
    const formContainer = document.createElement('div');
    formContainer.className = 'note-form';

    // Create the title input
    const titleInput = document.createElement('input');
    titleInput.id = 'title-input';
    titleInput.type = 'text';
    titleInput.value = existingTitle;
    titleInput.placeholder = 'Note Title';

    // Create the Quill editor container
    const editorContainer = document.createElement('div');
    editorContainer.id = 'quill-editor';
    editorContainer.style.height = '200px';
    editorContainer.style.fontSize = '20px';
    editorContainer.innerHTML = existingContent; // Set existing content

    // Create the save button
    const saveButton = document.createElement('button');
    saveButton.id = 'save-button';
    saveButton.textContent = 'Save';
    saveButton.style.marginTop = '10px';

    // Create the cancel button
    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-button';
    cancelButton.style.backgroundColor = 'rgb(239, 0, 0)';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.marginTop = '10px';
    cancelButton.style.float = 'left';

    // Append elements to form container
    formContainer.appendChild(titleInput);
    formContainer.appendChild(editorContainer);
    formContainer.appendChild(saveButton);
    formContainer.appendChild(cancelButton);

    // Append form container to the body
    document.body.appendChild(formContainer);

    // Initialize Quill editor
    const quill = new Quill('#quill-editor', {
        theme: 'snow'
    });

    // Set existing content in Quill editor
    quill.root.innerHTML = existingContent;

    // Handle save button click
    saveButton.addEventListener('click', async () => {
        const title = titleInput.value.trim();
        const content = quill.root.innerHTML; // Use Quill instance to get content
        
        if (title === '' || content === '') {
            alert('All fields are required');
            return;
        }

        // Make PUT request to update note
        try {
            const response = await fetch(`http://localhost:3000/api/update-note/${noteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content, createdAt })
            });

            const result = await response.json();

            if (response.ok) {
        
                formContainer.remove();
                await getNotes(); // Refresh the notes list
            } else {
                alert(result.message || 'An error occurred');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        }

        formContainer.remove();
    });

    // Handle cancel button click
    cancelButton.addEventListener('click', () => {
        formContainer.remove();
    });
}

async function getNotes() {
    const email = localStorage.getItem('globalEmail');

    if (!email) {
        console.error('No email found in localStorage');
        return;
    }

    try {
        const userResponse = await fetch(`http://localhost:3000/api/user-notes/${encodeURIComponent(email)}`);
        const userResult = await userResponse.json();

        if (userResponse.ok) {
            const notesContainer = document.querySelector('.notes');
            notesContainer.innerHTML = ''; // Clear existing notes

            const addNoteButton = document.createElement('button');
            addNoteButton.id = 'add-note';
            addNoteButton.className = 'note';
            addNoteButton.innerHTML = '<img src="../assets/add.png" alt="Add icon" id="add-note-image">';
            notesContainer.appendChild(addNoteButton);

            userResult.notes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.dataset.id = note._id; // Set note ID
                noteElement.dataset.title = note.title.toLowerCase();
                noteElement.dataset.content = note.content.toLowerCase();

                const titleElement = document.createElement('h3');
                titleElement.textContent = note.title;
                noteElement.appendChild(titleElement);

                const contentElement = document.createElement('div');
                contentElement.innerHTML = note.content;
                contentElement.className = 'note-content';
                noteElement.appendChild(contentElement);

                const createdAtElement = document.createElement('p');
                createdAtElement.textContent = `Created At: ${new Date(note.createdAt).toLocaleString()}`;
                createdAtElement.className = 'created-at';
                noteElement.appendChild(createdAtElement);

                notesContainer.appendChild(noteElement);

                noteElement.addEventListener('click', () => {
                    editNote(note._id, note.title, note.content, note.createdAt);
                });
            });

            addNoteButton.addEventListener('click', addCard);
        } else {
            console.error('Error fetching user notes:', userResult.message);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function filterNotes(query) {
    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
        const title = note.dataset.title || '';
        const content = note.dataset.content || '';

        if (title.includes(query) || content.includes(query)) {
            note.style.display = ''; // Show matching note
        } else {
            note.style.display = 'none'; // Hide non-matching note
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const addNoteButton = document.getElementById('add-note');
    addNoteButton.addEventListener('click', addCard);
    await getNotes();

    // Initialize search button and input
    const searchButton = document.querySelector('.search-button');
    const searchInput = document.querySelector('.search-input');
    
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const searchText = searchInput.value.toLowerCase().trim();
            filterNotes(searchText);
        });

        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchButton.click();
            }
        });
    }
});