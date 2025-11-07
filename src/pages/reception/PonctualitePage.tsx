import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
    fetchSigleItem,
    showConfirmationDialog,
} from "../../api/callApi";
import {
    fileUrl,
    showErrorMessage,
    showSuccessMessage,
} from "../../api/config";
import { LoaderAndError } from "../../components";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import LoadingSpinner from "../../components/LoadingSpinner";

interface EventItem {
    id?: number;
    name: string;
    start: string;
    end?: string;
    color?: string;
    photoEleve?: string | null;
    nomEleve?: string;
    details?: string;
}

export default function PonctualitePage() {
    const { codeInscription } = useParams<{ codeInscription: string }>();
    const calendarRef = useRef<FullCalendar | null>(null);

    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [showModal, setShowModal] = useState(false);

    // ✅ Chargement des données
    const getCalendarPresence = async (code?: string) => {
        // console.log("📦 codeInscription reçu:", code);
        if (!code) return;

        setLoading(true);
        try {
            const res = await fetchSigleItem<any>("/fetch_calendrier_presence_eleve", String(code));

            // 🟢 Gère les différents formats possibles
            const data = Array.isArray(res)
                ? res
                : Array.isArray(res?.data)
                    ? res.data
                    : [];

            // console.log("✅ Événements reçus:", data);
            setEvents(data);
        } catch (err) {
            console.error("❌ Erreur fetch:", err);
            showErrorMessage("Erreur de chargement du calendrier.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Gère le clic sur un événement
    const handleEventClick = (info: any) => {
        const event = info.event.extendedProps as EventItem;
        setSelectedEvent({
            ...event,
            name: info.event.title,
            start: info.event.startStr,
            end: info.event.endStr,
        });
        setShowModal(true);
    };

    

    const handleNext = () => calendarRef.current?.getApi()?.next();
    const handlePrev = () => calendarRef.current?.getApi()?.prev();
    const handleToday = () => calendarRef.current?.getApi()?.today();

    // ✅ Effet principal
    useEffect(() => {
        getCalendarPresence(codeInscription);
    }, [codeInscription]);

    return (
        <div className="col-md-12">
            <div className="page-header d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h4>Ponctualité</h4>
                    <p className="text-muted mb-0">Gérez les présences et retards</p>
                    <LoadingSpinner loading={loading} />
                </div>
                <div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => getCalendarPresence(codeInscription)}
                    >
                        <i className="fas fa-sync me-1"></i> Recharger
                    </button>
                </div>
            </div>

            <LoaderAndError loading={loading} error={error} onClearError={() => setError(null)} />

            <div className="card">
                <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                        <button className="btn btn-light btn-sm me-2" onClick={handlePrev}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button className="btn btn-light btn-sm me-2" onClick={handleToday}>
                            Aujourd’hui
                        </button>
                        <button className="btn btn-light btn-sm me-2" onClick={handleNext}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>

                    {/* ✅ FullCalendar avec rendu stable */}
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={frLocale}
                        events={events.map((ev, index) => ({
                            id: ev.id?.toString() || index.toString(),
                            title: ev.name,
                            start: ev.start,
                            end: ev.end,
                            backgroundColor: ev.color || "#28a745",
                            borderColor: ev.color || "#28a745",
                            extendedProps: ev,
                        }))}
                        eventClick={handleEventClick}
                        height="auto"
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        buttonText={{
                            today: "Aujourd’hui",
                            month: "Mois",
                            week: "Semaine",
                            day: "Jour",
                        }}
                    />
                </div>
            </div>

            {/* ✅ Modal détail */}
            {showModal && selectedEvent && (
                <div
                    className="modal fade show"
                    style={{ display: "block", background: "rgba(0,0,0,0.4)" }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div
                                className="modal-header text-white"
                                style={{ backgroundColor: selectedEvent.color || "#007bff" }}
                            >
                                <h5 className="modal-title">
                                    {selectedEvent.nomEleve
                                        ? `${selectedEvent.nomEleve} - ${selectedEvent.name}`
                                        : selectedEvent.name}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="d-flex align-items-center mb-3">
                                    <img
                                        src={
                                            selectedEvent.photoEleve
                                                ? `${fileUrl}/images/${selectedEvent.photoEleve}`
                                                : `${fileUrl}/images/avatar.png`
                                        }
                                        alt="eleve"
                                        width={60}
                                        height={60}
                                        className="rounded-circle me-3"
                                    />
                                    <div>
                                        <p className="mb-0">
                                            <strong>Du :</strong>{" "}
                                            {new Date(selectedEvent.start).toLocaleString()}
                                        </p>
                                        {selectedEvent.end && (
                                            <p className="mb-0">
                                                <strong>Au :</strong>{" "}
                                                {new Date(selectedEvent.end).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                               
                            </div>
                            <div className="modal-footer">
                                
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setShowModal(false)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

          
        </div>
    );
}
