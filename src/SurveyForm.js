import React, { useState } from 'react';
import { firestore } from './firebase'; // Import Firestore from firebase.js

function SurveyForm() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [age, setAge] = useState('');
  const [showReport, setShowReport] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowReport(true);
  };

  const handleAddToFirestore = async () => {
    try {
      await firestore.collection('surveyResponses').add({
        name,
        surname,
        age: parseInt(age),
      });
      console.log('Data added to Firestore successfully');
    } catch (error) {
      console.error('Error adding data to Firestore:', error);
    }
  };

  const handleGoBack = () => {
    setShowReport(false);
    setName('');
    setSurname('');
    setAge('');
  };

  return (
    <div>
      {!showReport ? (
        <form onSubmit={handleSubmit}>
          {/* Form inputs */}
          {/* Submit button */}
        </form>
      ) : (
        <div>
          {/* Survey report */}
          {/* Button to add data to Firestore */}
          <button onClick={handleAddToFirestore}>Add to Firestore</button>
          {/* Button to go back */}
          <button onClick={handleGoBack}>Go Back</button>
        </div>
      )}
    </div>
  );
}

export default SurveyForm;