import "../index.css";
import Header from "./Header.js";
import Main from "./Main.js";
import PopupWithForm from "./PopupWithForm.js";
import ImagePopup from "./ImagePopup.js";
import Login from "./Login";
import Register from "./Register";
import InfoTooltip from "./InfoTooltip";
import * as auth from "../utils/auth.js";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import React from "react";
import CurrentUserContext from "../contexts/CurrentUserContext.js";
import api from "../utils/api";
import EditProfilePopup from "./EditProfilePopup.js";
import EditAvatarPopup from "./EditAvatarPopup.js";
import AddPlacePopup from "./AddPlacePopup.js";
import ProtectedRoute from "./ProtectedRoute.js";

function App() {
  React.useEffect(() => {
    document.body.classList.add("body");
  }, []);

  const navigate = useNavigate();

  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] =
    React.useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] =
    React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState({});
  const [currentUser, setCurrentUser] = React.useState({});
  const [cards, setCards] = React.useState([]);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [infoTool, setInfoTool] = React.useState(false);
  const [isInfoTooltipPopupOpen, setIsInfoTooltipPopupOpen] =
    React.useState(false);
  const [email, setEmail] = React.useState("");

  function handleCardClick(card) {
    setSelectedCard(card);
  }
  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }
  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }
  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }
  function closeAllPopups() {
    setIsAddPlacePopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setSelectedCard({});
    setIsInfoTooltipPopupOpen(false);
  }
  React.useEffect(() => {
    if (loggedIn) {
      Promise.all([api.getUserInfo(), api.getInitialCards()])
        .then(([info, infoCard]) => {
          setCurrentUser(info);
          infoCard.forEach((cards) => {
            cards.myId = info._id;
          });
          setCards(infoCard);
        })
        .catch((error) =>
          console.error(`Ошибка получения информации ${error}`)
        );
    }
  }, [loggedIn]);
  function handleCardLike(card) {
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    if (isLiked) {
      api
        .deleteLike(card._id)
        .then((newCard) => {
          setCards((state) =>
            state.map((c) => (c._id === card._id ? newCard : c))
          );
        })
        .catch((error) => console.error(`Ошибка удаления лайка ${error}`));
    } else {
      api
        .putLike(card._id, !isLiked)
        .then((newCard) => {
          setCards((state) =>
            state.map((c) => (c._id === card._id ? newCard : c))
          );
        })
        .catch((error) => console.error(`Ошибка добавления лайка ${error}`));
    }
  }
  function handleCardDelete(cardId) {
    api
      .deleteCard(cardId)
      .then(() => {
        setCards((state) => state.filter((item) => item._id !== cardId));
        closeAllPopups();
      })
      .catch((error) => console.error(`Ошибка удаления карточки ${error}`));
  }
  function handleUpdateUser(props) {
    api
      .setUserInfo(props)
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((error) =>
        console.error(`Ошибка редактирования профиля ${error}`)
      );
  }
  function handleUpdateAvatar(props) {
    api
      .setUserAvatar(props)
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((error) =>
        console.error(`Ошибка редактирования аватара ${error}`)
      );
  }
  function handleAddPlaceSubmit(props) {
    api
      .addCard(props)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((error) => console.error(`Ошибка добавления карточки ${error}`));
  }

  function handleLogin(email, password)  {
    auth
      .authorize(email, password)
      .then((data) => {
        localStorage.setItem("jwt", data.token);
        setLoggedIn(true);
        setEmail(email);
        navigate("/", { replace: true });
      })
      .catch((err) => {
        setInfoTool(false);
        setIsInfoTooltipPopupOpen(true);
        console.log(err);
      });
  };

  function handleRegister(email, password) {
    auth
      .registration(email, password)
      .then(() => {
        setInfoTool(true);
        setIsInfoTooltipPopupOpen(true);
        navigate("/sign-in", { replace: true });
      })
      .catch((err) => {
        setInfoTool(false);
        setIsInfoTooltipPopupOpen(true);
        console.log(err);
      });
  }
  React.useEffect(() => {
    if (localStorage.getItem("jwt")) {
      const jwt = localStorage.getItem("jwt");
      auth
        .checkToken(jwt)
        .then((res) => {
          if (res) {
            setEmail(res.data.email);
            setLoggedIn(true);
            navigate("/", { replace: true });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, []);

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="page">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute
                element={Main}
                loggedIn={loggedIn}
                cards={cards}
                email={email}
                onAddPlace={handleAddPlaceClick}
                onEditProfile={handleEditProfileClick}
                onEditAvatar={handleEditAvatarClick}
                onCardClick={handleCardClick}
                onCardLike={handleCardLike}
                onCardDelete={handleCardDelete}
              />
            }
          />
          <Route
            path="/sign-in"
            element={
              <>
                <Header
                  direction="Регистрация"
                  loggedIn={false}
                  to={"/sign-up"}
                />
                <Login loggedIn={loggedIn} handleLogin={handleLogin} />
              </>
            }
          />
          <Route
            path="/sign-up"
            element={
              <>
                <Header direction="Войти" loggedIn={false} to={"/sign-in"} />
                <Register register={handleRegister} />
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <EditProfilePopup
        isOpen={isEditProfilePopupOpen}
        onClose={closeAllPopups}
        onUpdateUser={handleUpdateUser}
      />
      <AddPlacePopup
        isOpen={isAddPlacePopupOpen}
        onClose={closeAllPopups}
        onAddPlace={handleAddPlaceSubmit}
      />
      <EditAvatarPopup
        isOpen={isEditAvatarPopupOpen}
        onClose={closeAllPopups}
        onUpdateUser={handleUpdateAvatar}
      />
      <PopupWithForm
        title="Вы уверены?"
        name="question"
        buttonText="Да"
      ></PopupWithForm>
      <ImagePopup card={selectedCard} onClose={closeAllPopups} />
      <InfoTooltip
        onClose={closeAllPopups}
        status={infoTool}
        isOpen={isInfoTooltipPopupOpen}
      />
    </CurrentUserContext.Provider>
  );
}

export default App;
