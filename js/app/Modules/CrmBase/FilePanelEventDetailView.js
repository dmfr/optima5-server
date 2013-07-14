Ext.define('Optima5.Modules.CrmBase.FilePanelEventDetailView',{
	extend:'Ext.Component',
	
	requires: [
		'Ext.XTemplate'
	],
	
	initComponent : function(){
		this.callParent(arguments);
		this.addEvents({
			eventsrendered: true
		});
		
		var me = this ;
		if( (me.filePanelCalendar) instanceof Optima5.Modules.CrmBase.FilePanelCalendar ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelEventDetailView','No FilePanelCalendar reference ?') ;
		}
		me.on('destroy',function(thisview) {
			delete thisview.filePanelCalendar ;
		},me) ;
		
		/*
		 * Mapping de répartition des champs :
		 * - Account 
		 * - Event (start/end)
		 * - CRM
		 * pour mise en page
		 */
		var gridCfg = me.filePanelCalendar.gridCfg,
			calendarCfg = gridCfg.define_file.calendar_cfg,
			fileCode = gridCfg.define_file.file_code,
			accountFileField = ( calendarCfg.account_is_on ? calendarCfg.account_filefield : null),
			isDoneFileField = calendarCfg.eventstatus_filefield ,
			colorFileField = ( calendarCfg.color_is_fixed ? calendarCfg.color_filefield : null),
			startFileField = calendarCfg.eventstart_filefield ,
			endFileField = calendarCfg.eventend_filefield ,
			durationSrcFileField = ( calendarCfg.duration_is_fixed ? calendarCfg.duration_src_filefield : null ),
			durationSrcBibleField = ( calendarCfg.duration_is_fixed ? calendarCfg.duration_src_biblefield : null ),
			tplMapping = {
				accountField: null,
				accountSrcValues: null,
				colorField: null,
				startField: null,
				endField: null,
				isDoneField: null,
				
				crmFields: []
			},
			tIdx = -1,
			tFileField = null;
		Ext.Array.each( gridCfg.grid_fields, function( gridField ) {
			if( gridField.file_code != fileCode ) {
				return ;
			}
			if( accountFileField != null && gridField.file_field == accountFileField 
					&& gridField.link_bible_is_key==true && gridField.link_bible_type=='entry' ) {
				tplMapping.accountField = gridField.field ;
				tplMapping.accountSrcValues = this.helperGetLinkBibleSrcValues( accountFileField ) ;
			}
			if( isDoneFileField != null && gridField.file_field == isDoneFileField ) {
				tplMapping.isDoneField = gridField.field ;
			}
			if( colorFileField != null && gridField.file_field == colorFileField ) {
				tplMapping.colorField = gridField.field ;
			}
			
			if( gridField.file_field == startFileField ) {
				tplMapping.startField = gridField.field ;
			}
			if( gridField.file_field == endFileField ) {
				tplMapping.endField = gridField.field ;
			}
			
			/*
			 * Regular CRM fields
			 * - exclude calendarCfg fields above
			 * - File fields (is_header=TRUE)
			 * - Bible link fields ( link_bible_type=entry + link_bible_is_key=FALDE + link_bible_is_header=TRUE)
			 */
			if( (accountFileField != null && accountFileField == gridField.file_field)
				|| (isDoneFileField != null && isDoneFileField == gridField.file_field)
				|| (colorFileField != null && colorFileField == gridField.file_field)
				|| (startFileField != null && startFileField == gridField.file_field)
				|| (endFileField != null && endFileField == gridField.file_field) ) {
				
				return true ;
			}
			
			if( !gridField.file_field ) {
				return true ;
			}
			
			if( tFileField == null || gridField.file_field != tFileField ) {
				tIdx++ ;
				tFileField = gridField.file_field ;
				tplMapping.crmFields.push({
					fieldLabel: gridField.file_field_lib,
					fieldSrcValues: me.helperGetLinkBibleSrcValues( tFileField )
				});
			}
		},me) ;
		
		me.tplMapping = tplMapping ;
	},
	helperGetLinkBibleSrcValues: function( fileField ) {
		var me = this,
			gridCfg = me.filePanelCalendar.gridCfg,
			fileCode = gridCfg.define_file.file_code,
			returnArr = [] ;
		
		Ext.Array.each( gridCfg.grid_fields, function( gridField ) {
			if( gridField.file_code != fileCode ) {
				return ;
			}
			if( gridField.file_field != fileField ) {
				return ;
			}
			
			if( gridField.link_bible ) {
				if( gridField.link_bible_type == 'entry' && gridField.link_bible_is_header ) {
					returnArr.push({
						fieldSrc: gridField.field,
						fontBold: gridField.link_bible_is_key
					}) ;
				}
			} else {
				returnArr.push({
					fieldSrc: gridField.field,
					fontBold: false
				}) ;
			}
		},me) ;
		return returnArr ;
	},

	afterRender: function() {
		this.tpl = this.getTemplate();

		this.callParent(arguments);
	},

	getTemplate: function() {
		if (!this.tpl) {
			this.tpl = new Ext.XTemplate(
				'<div class="op5-crmbase-filecalendar-eventdetail">',
					'<tpl if="headerColor">',
						'<div class="op5-crmbase-filecalendar-eventdetail-account" style="background-color:{headerColor}">',
							'{[ values.headerTxt != null ? values.headerTxt : "&#160;"]}',
						'</div>',
					'</tpl>',
					
					'<div class="op5-crmbase-filecalendar-eventdetail-timewrap">',
						'<div class="op5-crmbase-filecalendar-eventdetail-timedone {[values.isDone ? "op5-crmbase-filecalendar-eventdetail-timedoneicon" : ""]}">&#160;</div>',
						'<div style="position:relative;">',
							'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">Start:</span>',
							'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{startTxt}</span>',
						'</div>',
						'<div style="position:relative;">',
							'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">End:</span>',
							'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{endTxt}</span>',
						'</div>',
					'</div>',
					
					'<tpl if="crmFields">',
						'<table class="op5-crmbase-filecalendar-eventdetail-tbl" cellpadding="0" cellspacing="0">',
						'<tpl for="crmFields">',
							'<tr>',
								'<td class="op5-crmbase-filecalendar-eventdetail-tdlabel">{fieldLabel}</td>',
								'<td class="op5-crmbase-filecalendar-eventdetail-tdvalue">{fieldValue}</td>',
							'</tr>',
						'</tpl>',
						'</table>',
					'</tpl>',
				'</div>'
			);
		}
		this.tpl.compile();
		return this.tpl;
	},

	update: function(evtId) {
		this.evtId = evtId;
		this.refresh();
	},

	refresh: function() {
		if (!this.rendered) {
			return;
		}
		if( this.evtId == null ) {
			return ;
		}
		
		var filerecord = this.filePanelCalendar.dataCacheArray[this.evtId],
			tplMapping = this.tplMapping ;
		
		var tRenderer = function( tFilerecord, tSrcValues ) {
			var arrStr = [] ;
			for( var i=0 ; i<tSrcValues.length ; i++ ) {
				var mkey = tSrcValues[i].fieldSrc ;
				var bold = tSrcValues[i].fontBold ;
				
				if( tFilerecord[mkey] ) {
					arrStr.push( (bold?'<b>':'')+tFilerecord[mkey]+(bold?'</b>':'') ) ;
				}
			}
			return arrStr.join(' ') ;
		}
		
		var sampleTplData = {
			isDone: ( tplMapping.isDoneField && filerecord[tplMapping.isDoneField]==1 ),
			headerColor: null ,
			headerTxt: ( tplMapping.accountSrcValues != null ? tRenderer(filerecord,tplMapping.accountSrcValues) : null ),
			startTxt: Ext.Date.format( Ext.Date.parse(filerecord[tplMapping.startField], "Y-m-d H:i:s", true), "Y-m-d H:i" ) ,
			endTxt: Ext.Date.format( Ext.Date.parse(filerecord[tplMapping.endField], "Y-m-d H:i:s", true), "Y-m-d H:i" ) ,
			crmFields:[]
		} ;
		
		if( tplMapping.accountField ) {
			var eKey = filerecord[tplMapping.accountField] ;
			sampleTplData.headerColor = '000000' ;
			if( this.filePanelCalendar.calendarStore.getById(eKey) != null ) {
				sampleTplData.headerColor = this.filePanelCalendar.calendarStore.getById(eKey).get('ColorHex') ;
			}
		}
		if( tplMapping.colorField ) {
			sampleTplData.headerColor = filerecord[tplMapping.colorField] ;
		}
		
		for( var i=0 ; i<tplMapping.crmFields.length ; i++ ) {
			sampleTplData.crmFields.push({
				fieldLabel: tplMapping.crmFields[i].fieldLabel,
				fieldValue: tRenderer(filerecord,tplMapping.crmFields[i].fieldSrcValues)
			}) ;
		}
		
		this.tpl.overwrite(this.el, sampleTplData);
		this.fireEvent('eventdetailrendered', this, null );
	},

	getTemplateEventData: function(evt) {
		var data = this.view.getTemplateEventData(evt);
		data._elId = 'dtl-' + data._elId;
		return data;
	}
}) ;