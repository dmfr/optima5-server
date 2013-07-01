Ext.define('Optima5.Modules.CrmBase.FilePanelCalendar' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Ext.calendar.CalendarPanel',
		'Ext.calendar.data.MemoryCalendarStore',
		'Ext.calendar.data.MemoryEventStore',
		'Ext.calendar.util.Date',
		'Ext.calendar.data.Events',
		'Ext.calendar.data.Calendars'
	],
	
	alias : 'widget.op5crmbasefilecalendar',
			  
	initComponent: function() {
		var me = this ;
		
		/*
		 * Création des stores locaux
		 * -
		 * 
		 */
		this.calendarStore = Ext.create('Ext.calendar.data.MemoryCalendarStore', {
			data: Ext.calendar.data.Calendars.getData()
		});
		
		
		Ext.apply(me,{
			layout: 'border',
			title: '...',
			items: [{
				itemId:'calendar-center',
				xtype:'container',
				region:'center'
			},{
				itemId:'calendar-west',
				region:'west',
				layout:{
					type:'vbox',
					align: 'stretch'
				},
				bodyCls: 'ux-noframe-bg',
				width: 179,
				border: true,
				items: [{
					xtype: 'datepicker',
					itemId: 'calendar-nav-datepicker',
					cls: 'ext-cal-nav-picker',
					listeners: {
						'select': {
							fn: function(dp, dt){
								me.setStartDate(dt);
							},
							scope: me
						}
					}
				},{
					xtype:'grid',
					itemId: 'calendar-nav-accounts',
					border: false,
					hidden: false,
					flex:1,
					title:'Test',
					model:'CalendarModel',
					store: me.calendarStore,
					columns:[{
						text: '',
						width: 24,
						sortable: false,
						dataIndex: 'color',
						menuDisabled: true
					},{
						text: 'Device Info',
						flex: 1,
						sortable: false,
						dataIndex: 'desc',
						menuDisabled: true
					}]
				}]
			}]
		});
		
		me.callParent() ;
	}
	
});