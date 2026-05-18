import React, { useState } from 'react';
import { FaTimesCircle, FaPlus, FaSpinner } from 'react-icons/fa';
import { vendorApi } from '../../../../hooks/vendorApi';

const CreateEventModal = ({ isOpen, onClose, onEventCreated, actionLoading, setActionLoading }) => {
  const [eventFormData, setEventFormData] = useState({
    eventTitle: '',
    eventSubject: '',
    eventDescription: '',
    eventStartDate: '',
    eventEndDate: '',
    eventStartTime: '',    // changed from eventTime
    eventEndTime: '',      // new field
    eventLocation: '',
    eventTimezone: 'Asia/Kolkata',
    guests: []
  });

  const [eventImage, setEventImage] = useState(null);
  const [guestImages, setGuestImages] = useState([]);
  const [guestList, setGuestList] = useState([{ guestName: '' }]);

  const resetForm = () => {
    setEventFormData({
      eventTitle: '',
      eventSubject: '',
      eventDescription: '',
      eventStartDate: '',
      eventEndDate: '',
      eventStartTime: '',
      eventEndTime: '',
      eventLocation: '',
      eventTimezone: 'Asia/Kolkata',
      guests: []
    });
    setEventImage(null);
    setGuestImages([]);
    setGuestList([{ guestName: '' }]);
  };

  const handleGuestChange = (index, value) => {
    const updatedGuests = [...guestList];
    updatedGuests[index].guestName = value;
    setGuestList(updatedGuests);
  };

  const addGuestField = () => {
    setGuestList([...guestList, { guestName: '' }]);
  };

  const removeGuestField = (index) => {
    if (guestList.length > 1) {
      const updatedGuests = guestList.filter((_, i) => i !== index);
      setGuestList(updatedGuests);
    }
  };

  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    setEventFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEventImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEventImage(e.target.files[0]);
    }
  };

  const handleGuestImagesChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setGuestImages(files);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!eventFormData.eventTitle) { alert('Event title is required'); return; }
    if (!eventFormData.eventStartDate) { alert('Start date is required'); return; }
    if (!eventFormData.eventEndDate) { alert('End date is required'); return; }
    if (!eventFormData.eventStartTime) { alert('Start time is required'); return; }
    if (!eventFormData.eventEndTime) { alert('End time is required'); return; }
    if (!eventFormData.eventLocation) { alert('Event location is required'); return; }
    if (!eventImage) { alert('Event banner image is required'); return; }

    try {
      setActionLoading(prev => ({ ...prev, createEvent: true }));

      const validGuests = guestList.filter(g => g.guestName && g.guestName.trim() !== '');

      const eventData = {
        eventTitle: eventFormData.eventTitle,
        eventSubject: eventFormData.eventSubject || '',
        eventDescription: eventFormData.eventDescription || '',
        eventStartDate: eventFormData.eventStartDate,   // YYYY-MM-DD
        eventEndDate: eventFormData.eventEndDate,
        eventStartTime: eventFormData.eventStartTime,   // 24h format, e.g., "18:00"
        eventEndTime: eventFormData.eventEndTime,
        eventLocation: eventFormData.eventLocation,
        eventTimezone: eventFormData.eventTimezone,
        guests: validGuests,
      };

      const response = await vendorApi.createEvent(eventData, eventImage, guestImages);

      if (response.success) {
        alert('Event created successfully!');
        resetForm();
        onEventCreated();
        onClose();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error.message || 'Failed to create event.');
    } finally {
      setActionLoading(prev => ({ ...prev, createEvent: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Create New Event</h3>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimesCircle className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="eventTitle"
                value={eventFormData.eventTitle}
                onChange={handleEventFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g., Summer Fashion Fest"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Subject
              </label>
              <input
                type="text"
                name="eventSubject"
                value={eventFormData.eventSubject}
                onChange={handleEventFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g., Fashion Show"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Description
            </label>
            <textarea
              name="eventDescription"
              value={eventFormData.eventDescription}
              onChange={handleEventFormChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Describe your event..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="eventStartDate"
                value={eventFormData.eventStartDate}
                onChange={handleEventFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="eventEndDate"
                value={eventFormData.eventEndDate}
                onChange={handleEventFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                name="eventStartTime"
                value={eventFormData.eventStartTime}
                onChange={handleEventFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                name="eventEndTime"
                value={eventFormData.eventEndTime}
                onChange={handleEventFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <input
                type="text"
                name="eventTimezone"
                value={eventFormData.eventTimezone}
                onChange={handleEventFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Location *
              </label>
              <input
                type="text"
                name="eventLocation"
                value={eventFormData.eventLocation}
                onChange={handleEventFormChange}
                placeholder="e.g., Abu Dhabi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Banner Image *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleEventImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              required
            />
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">
                Guests {guestList.filter(g => g.guestName.trim() !== '').length > 0 && 
                  `(${guestList.filter(g => g.guestName.trim() !== '').length})`}
              </label>
              <button
                type="button"
                onClick={addGuestField}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
              >
                <FaPlus className="mr-1 h-3 w-3" />
                Add Guest
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {guestList.map((guest, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={guest.guestName}
                    onChange={(e) => handleGuestChange(index, e.target.value)}
                    placeholder={`Guest ${index + 1} Name`}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {guestList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGuestField(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimesCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {guestList.filter(g => g.guestName.trim() !== '').length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Guest Images (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGuestImagesChange}
                  className="w-full text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload in same order as guest list
                </p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex space-x-3">
            <button
              type="submit"
              disabled={actionLoading.createEvent}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 flex items-center justify-center"
            >
              {actionLoading.createEvent ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;