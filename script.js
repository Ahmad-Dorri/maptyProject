'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (+new Date() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; //in min
  }
}

class Running extends Workout {
  type = 'running';
  description = `${
    this.type.slice(0, 1).toUpperCase() + this.type.slice(1)
  } on ${Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
  }).format(this.date)}`;
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  description = `${
    this.type.slice(0, 1).toUpperCase() + this.type.slice(1)
  } on ${Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
  }).format(this.date)}`;
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// //////////////////////////////////////
// //////APPLICATION
class App {
  #map;
  #mapE;

  constructor() {
    this.workouts = [];
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElavationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  //GET CURRENT POSISION
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          console.error('cannot reach your location.');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    this.workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapEvent) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this.#mapE = mapEvent;
  }

  //CHANGE 4TH INPUT INTO TYPE
  _toggleElavationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const positiveInput = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();

    // GET DATA FROM FORM
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapE.latlng;
    let workout;
    //IF WORKOUT RUNNING, CREATE RUNNING OBJECT
    if (type === 'running') {
      const cadance = +inputCadence.value;
      // CHECK INPUTS IF IT IS VALID
      if (
        !validInputs(distance, duration, cadance) ||
        !positiveInput(distance, duration, cadance)
      )
        return alert('inputs have to positive Numbers!');
      workout = new Running([lat, lng], distance, duration, cadance);
      this.workouts.push(workout);
    }
    // IF WORKOUT CYCLING, CREATE CYCLING OBJECT
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      // CHECK INPUTS IF IT IS VALID
      if (
        !validInputs(distance, duration, elevation) ||
        !positiveInput(distance, duration)
      )
        return alert('inputs have to positive Numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
      this.workouts.push(workout);
    }

    //ADD NEW WORKOUT TO THE WORKOUT ARRAY

    //RENDER WORKOUT AS A MARKER

    this._renderWorkoutMarker(workout);
    // RENDER WORKOUT AS A LIST ITEM
    this._renderWorkoutList(workout);
    //CLEARING INPUT FIELDS AFTER SUBMIT
    this._clearForm();
    // STORE WORKOUTS INTO LOCAL STORAGE
    this._setToLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,

          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
  }

  _renderWorkoutList(workout) {
    // console.log(workout);
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }
  _clearForm() {
    form.classList.add('hidden');
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    inputDistance.focus();
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    const workout = this.workouts.find(el => workoutEl.dataset.id === el.id);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
  }
  _setToLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;

    this.workouts = data;

    this.workouts.forEach(work => this._renderWorkoutList(work));
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
