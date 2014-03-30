//@define Ext.calendar.data.CalendarMappings
/**
 * @class Ext.calendar.data.CalendarMappings
 * @extends Object
 * A simple object that provides the field definitions for Calendar records so that they can be easily overridden.
 */
Ext.ns('Ext.calendar.data');

Ext.calendar.data.CalendarMappings = {
    CalendarId: {
        name:    'CalendarId',
        mapping: 'id',
        type:    'auto'
    },
    Title: {
        name:    'Title',
        mapping: 'title',
        type:    'string'
    },
    Description: {
        name:    'Description', 
        mapping: 'desc',   
        type:    'string' 
    },
    ColorHex: {
        name:    'ColorHex',
        mapping: 'color_hex6',
        type:    'string'
    },
    IsHidden: {
        name:    'IsHidden',
        mapping: 'hidden',
        type:    'boolean'
    }
};