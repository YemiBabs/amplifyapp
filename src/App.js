import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';

const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
	const apiData = await API.graphql({ query: listNotes });
	const notesFromAPI = apiData.data.listNotes.items;
	await Promise.all(notesFromAPI.map(async note => {
		if (note.image) {
			const image = await Storage.get(note.image);
			note.image = image;
		}
		return note;
	}))
	setNotes(apiData.data.listNotes.items);
	}

	async function createNote() {
		if (!formData.name || !formData.description) return;
		await API.graphql({ query: createNoteMutation, variables: { input: formData } });
		if (formData.image) {
			const image = await Storage.get(formData.image);
			formData.image = image;
		}
		setNotes([ ...notes, formData ]);
		setFormData(initialFormState);
	}

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }
  
  async function onChange(e) {
	if (!e.target.files[0]) return
	const file = e.target.files[0];
	setFormData({ ...formData, image: file.name });
	await Storage.put(file.name, file);
	fetchNotes();
}

  return (
  <div class="d-flex justify-content-center">
    <div className="w-50 p-3">
		<div class="d-flex justify-content-center">
			<h1>DentShare</h1>
		</div>
	<div class="form group">
		<label for="title">Document title:</label>
		<input class="form-control"
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Title" id="title"
        value={formData.name}/>
	</div>
	<div class="form-group">
		<label for="description">Document description:</label>
		<input class="form-control"
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Description" id
        value={formData.description}/>
	</div>
	<div class="form-group">
		<label for="load">Select document:</label>
		<input type="file" class="form-control"
		onChange={onChange}/>
	</div>
	<div>
		<button type="button" class="btn btn-primary" onClick={createNote}>Upload</button>
			<div style={{marginBottom: 30}}>
				{notes.map(note => (
					<div key={note.id || note.name}>
						<div class="d-flex justify-content-center">
							<h4>Title: {note.name}</h4>
						</div>
						<p>Description: {note.description}</p>
						<div class="d-flex justify-content-center">
							{note.image && <img src={note.image} style={{width: 400}} alt={{Node}}/>}
						</div>
					<div class="btn-group">
						<button type="button" class="btn btn-danger" onClick={() => deleteNote(note)}>Delete</button>
						<a href= {note.image} download> 
							<button type="button" class="btn btn-success">Download</button>
						</a>
					</div>
					</div>
				))}
			</div>
		<AmplifySignOut />
	</div>
    </div>
	</div>
  );
}

export default withAuthenticator(App);