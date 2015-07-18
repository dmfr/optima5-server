Ext.define('Optima5.Modules.Spec.DbsPeople.RealVirtualPanel',{
	extend:'Ext.form.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],
	
	saveOnDestroy: false,
	
	initComponent: function() {
		var me = this ;
		
		if( (me.parentRealPanel) instanceof Optima5.Modules.Spec.DbsPeople.RealPanel ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No parent reference ?') ;
		}
		if( (me.peopledayRecord) ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No peopledayRecord instance ?') ;
		}
		
		
		Ext.apply(me,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 5,
			title: 'Absence / Congé planifié',
			layout: {
				type:'anchor'
			},
			items: [{
				xtype:'fieldcontainer',
				layout: 'anchor',
				defaults: {
					labelAlign: 'left',
					labelWidth: 50,
					anchor: '100%',
					margin: 1
				},
				items: [{
					xtype:'displayfield',
					fieldLabel: 'Nom',
					value: '<b>' + me.peopledayRecord.get('people_name') + '</b>'
				},{
					xtype:'displayfield',
					fieldLabel: 'Date',
					value: '<b>' + Ext.Date.format( Ext.Date.parse(me.peopledayRecord.get('date_sql'),'Y-m-d'), 'd/m/Y') + '</b>'
				}]
			},{
				xtype:'fieldset',
				itemId: 'absPanel',
				checkboxToggle: true,
				checkboxName: 'rh_abs_is_on',
				collapsed: true,
				margin: '4px',
				defaults: {
					labelAlign: 'left',
					labelWidth: 70,
					anchor: '100%'
				},
				items: [{
					xtype:'combobox',
					itemId: 'absCombobox',
					matchFieldWidth:false,
					listConfig:{width:200},
					forceSelection:true,
					allowBlank:false,
					editable:true,
					typeAhead:true,
					selectOnFocus: true,
					queryMode: 'local',
					displayField: 'text',
					valueField: 'id',
					fieldLabel: 'Motif',
					name: 'rh_abs_code' ,
					store: {
						fields:['id','text'],
						data: Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS",false)
					}
				},{
					xtype: 'datefield',
					allowBlank: false,
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					startDay: 1,
					fieldLabel: 'Début',
					name: 'rh_abs_date_start',
					anchor: '',
					width: 170
				},{
					xtype: 'datefield',
					allowBlank: false,
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					startDay: 1,
					fieldLabel: 'Fin',
					name: 'rh_abs_date_end',
					anchor: '',
					width: 170
				},{
					xtype: 'checkboxfield',
					fieldLabel: '1/2 journée',
					name: 'rh_abs_half_day'
				},{
					xtype: 'container',
					style: {
						textAlign:'center'
					},
					padding: '4px 0px',
					items:[{
						xtype: 'component',
						style: {
							display: 'inline'
						},
						overCls: 'op5-crmbase-dataimport-go-over',
						renderTpl: Ext.create('Ext.XTemplate',
							'<div class="op5-crmbase-dataimport-go-btn">',
							'</div>',
							{
								compiled:true,
								disableFormats: true
							}
						),
						listeners: {
							afterrender: function(c) {
								c.getEl().on('click',function(){
									this.rhAbsDownload();
								},this) ;
							},
							scope: this
						}
					}]
				}]
			}]
		});
		
		this.callParent() ;
		
		this.getForm().getFields().each(function(field) {
			field.on('change',function(field){
				this.evalForm(field);
			},me) ;
		},me) ;
		this.on('afterrender',function(formpanel) {
			Ext.defer(function() {
				formpanel.rhAbsLoad() ;
			},100);
		}) ;
	},
	evalForm: function(changedField) {
		var me = this ;
		me.saveOnDestroy = true ;
		
		var form=this.getForm(),
			absCode = form.findField('rh_abs_code').getValue(),
			absData = Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ABS",absCode),
			startField = form.findField('rh_abs_date_start'),
			endField = form.findField('rh_abs_date_end'),
			halfDayCb = form.findField('rh_abs_half_day') ;
		
		var sameDay = ( !Ext.isEmpty(startField.getRawValue()) && startField.getRawValue() == endField.getRawValue() ),
			absHalfDayOpen = (absData && absData.halfDay_open) ;
			
		if( startField.getValue() > endField.getValue() ) {
			if( changedField == startField ) {
				endField.setValue( startField.getValue() ) ;
			}
			if( changedField == endField ) {
				startField.setValue( endField.getValue() ) ;
			}
		}
		
		halfDayCb.setVisible(sameDay && absHalfDayOpen) ;
	},
	
	rhAbsLoad: function() {
		this.showLoadmask() ;
		
		this.parentRealPanel.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'Real_RhAbsLoad',
				date_sql: this.peopledayRecord.get('date_sql'),
				people_code: this.peopledayRecord.get('people_code')
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.getForm().setValues(jsonResponse.formData) ;
					this.evalForm() ;
					this.saveOnDestroy = false ;
				} else {
					this.destroy() ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	rhAbsSave: function() {
		this.showLoadmask() ;
		
		var formValues = this.getForm().getValues() ;
		// AJAX : .........
		this.parentRealPanel.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'Real_RhAbsSave',
				people_code: this.peopledayRecord.get('people_code'),
				formData: Ext.JSON.encode(formValues)
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success != true ) {
					Ext.MessageBox.alert('Problem','Données saisies non valides') ;
				} else {
					this.parentRealPanel.autoRefreshAfterEdit = true ;
					this.destroy() ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	rhAbsDownload: function() {
		this.showLoadmask() ;
		
		var formValues = this.getForm().getValues() ;
		// AJAX : .........
		this.parentRealPanel.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'Real_RhAbsDownload',
				people_code: this.peopledayRecord.get('people_code'),
				formData: Ext.JSON.encode(formValues)
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.rhAbsDownloadOpen( jsonResponse.html ) ;
				} else {
					Ext.MessageBox.alert('Problem','Données saisies non valides') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	rhAbsDownloadOpen: function( pageHtml ) {
		this.parentRealPanel.optimaModule.createWindow({
			width:850,
			height:700,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: 'Demande Congé',
			items:[Ext.create('Ext.ux.dams.IFrameContent',{
				itemId: 'uxIFrame',
				content:pageHtml
			})],
			tbar:[{
				icon: 'images/op5img/ico_print_16.png',
				text: 'Print',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame'),
						uxIFrameWindows = uxIFrame.getWin() ;
					if( uxIFrameWindows == null ) {
						Ext.MessageBox.alert('Problem','Printing disabled !') ;
						return ;
					}
					uxIFrameWindows.print() ;
				},
				scope: this
			}]
		}); 
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		this.show() ; // HACK?
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	doQuit: function() {
		if( this.saveOnDestroy ) {
			this.saveOnDestroy = false ;
			this.rhAbsSave() ;
		}
	}
});