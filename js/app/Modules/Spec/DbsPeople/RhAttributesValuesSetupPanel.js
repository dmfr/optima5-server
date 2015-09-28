Ext.define('DbsPeopleRhAttributesValuesSetupDateModel',{
	extend: 'Ext.data.Model',
	idProperty: 'date_apply',
	fields: [
		{name: 'date_apply', type: 'string'}
	]
});
Ext.define('DbsPeopleRhAttributesValuesSetupRowModel',{
	extend: 'Ext.data.Model',
	idProperty: 'people_code',
	fields: [
		{name: 'people_code', type: 'string'},
		{name: 'people_name', type: 'string'}
	]
});


Ext.define('Optima5.Modules.Spec.DbsPeople.RhAttributesValuesSetupPanelCellEditing',{
	extend: 'Ext.grid.plugin.CellEditing',
	onSpecialKey: function(ed, field, e) {
		switch( e.getKey() ) {
			case e.UP :
			case e.DOWN :
			case e.LEFT :
			case e.RIGHT :
				return this.onSpecialKeyNav.apply(this,arguments) ;
			
			case e.TAB :
			case e.PAGE_UP :
			case e.PAGE_DOWN :
				e.stopEvent() ;
				break ;
		}
	},
	onSpecialKeyNav: function(ed, field, e) {
		e.stopEvent() ;
		
		var columnHeader = this.getActiveColumn(),
			record = this.getActiveRecord(),
			editingContext = this.getEditingContext(record,columnHeader),
			view,
			editorField ;
		if( !editingContext ) {
			return ;
		}
		view = columnHeader.getRootHeaderCt().view ;
		
		editorField = columnHeader.getEditor() ;
		if( editorField && editorField.listKeyNav && editorField.listKeyNav.map.isEnabled() ) {
			return ; // HACK : using BoundListKeyNav private property
		}
		
		var curColIdx = editingContext.colIdx,
			curRowIdx = editingContext.rowIdx,
			offsetCol = 0,
			offsetRow = 0 ;
		switch( e.getKey() ) {
			case e.UP :
				offsetRow-- ;
				break ;
			case e.DOWN :
				offsetRow++ ;
				break ;
			case e.LEFT :
				offsetCol-- ;
				break ;
			case e.RIGHT :
				offsetCol++ ;
				break ;
		}
		var node, columnHeader, record ;
		while( true ) {
			curColIdx += offsetCol ;
			curRowIdx += offsetRow ;
			if( curColIdx < 0 || curRowIdx < 0 ) {
				break ;
			}
			
			node = view.getNode(curRowIdx) ;
			if( !node ) {
				break ;
			}
			record = view.getRecord(node) ;
			
			columnHeader = this.grid.getColumnManager().getHeaderAtIndex(curColIdx) ;
			if( !columnHeader || !columnHeader.getEditor() ) {
				columnHeader = null ;
				break ;
			}
			
			break ;
		}
		
		if( !record || !columnHeader ) {
			return ;
		}
		
		// completeEdit
		this.completeEdit() ;
		
		// start new edit
		this.startEdit(record, columnHeader) ;
	},
	getEditor: function(record, column) {
		var editor = this.callParent(arguments) ;
		editor.completeOnEnter = false ;
		return editor ;
	}
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RhAttributesValuesSetupPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		var me = this ;
		var round2_renderer = function(v) {
			return ( Math.round(v*100) / 100 );
		} ;
		Ext.apply( me, {
			layout:{
				type:'vbox',
				align:'stretch'
			},
			frame: true,
			title: 'Initialisation Soldes Compteurs',
			items:[{
				xtype: 'panel',
				height: 64,
				bodyCls: 'ux-noframe-bg',
				border: false,
				layout: {
					type:'hbox',
					align:'stretch'
				},
				items: [{
					itemId: 'pHeader',
					xtype:'component',
					width: 64,
					cls: 'op5-spec-dbspeople-realsummary-box'
				},{
					xtype:'form',
					border: false,
					bodyPadding: '5px',
					bodyCls: 'ux-noframe-bg',
					flex: 1,
					layout: 'anchor',
					fieldDefaults: {
						labelAlign: 'left',
						labelWidth: 110,
						anchor: '100%'
					},
					items:[Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamSiteField',{
						optimaModule: this.optimaModule,
						submitValue: false,
						name : 'filter_site',
						fieldLabel: 'Site',
						listeners: {
							ready: {
								fn: function() {
									this.onPreInit() ;
								},
								scope: this
							}
						}
					}),{
						xtype:'datefield',
						startDay:1,
						format: 'Y-m-d',
						width: 240,
						anchor: '',
						value: null,
						name : 'date_apply',
						fieldLabel: '<b>Date Application</b>',
						listeners:{
							select: function( datepicker, date ) {
								this.onDateSet(date) ;
								Ext.menu.Manager.hideAll() ;
							},
							scope: this
						}
					}]
				}]
			},{
				xtype: 'panel',
				itemId: 'pGridContainer',
				layout: 'fit',
				border: false,
				bodyCls: 'ux-noframe-bg',
				items: []
			}]
		});
		this.preInit = 2 ;
		this.callParent() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'cfg_getPeopleCalcAttributes'
			},
			callback: function() {
				this.onPreInit() ;
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText),
					cfgPeopleCalcAttributes = (json.success ? json.data : []) ;
				this.cfgPeopleCalcAttributes = cfgPeopleCalcAttributes ;
			},
			scope: this
		});
	},
	onPreInit: function() {
		var me = this ;
		me.preInit-- ;
		if( me.preInit == 0 ) {
			me.isReady=true ;
			me.startPanel() ;
		}
	},
	
	startPanel: function() {
		this.getEl().mask('Initializing...') ;
		
		var filterSiteField = this.down('form').getForm().findField('filter_site') ;
		if( this.cfgData.filter_site ) {
			filterSiteField.setValue( this.cfgData.filter_site ) ;
		}
		filterSiteField.setReadOnly(true) ;
		
		this.rawRHgrid = null ;
		this.map_calcAttribute_rawFile = {} ;
		
		this.startSteps = (1 + this.cfgPeopleCalcAttributes.length) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getGrid',
				_load_calcAttributes: 0,
				filter_site_entries: ( Ext.isEmpty(filterSiteField.getValue()) ? '' : Ext.JSON.encode( filterSiteField.getLeafNodesKey() ) )
			},
			callback: function() {
				this.startPanel_onLoad() ;
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText) ;
				if( json.success ) {
					this.startPanel_onLoadRHgrid( json.data ) ;
				}
			},
			scope: this
		});
		
		Ext.Array.each( this.cfgPeopleCalcAttributes, function(peopleCalcAttr) {
			var peopleCalcAttribute = peopleCalcAttr.peopleCalcAttribute ;
			
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_people',
					_action: 'RH_getCalcAttributeSetupFile',
					people_calc_attribute: peopleCalcAttribute
				},
				callback: function() {
					this.startPanel_onLoad() ;
				},
				success: function( response ) {
					var json = Ext.JSON.decode(response.responseText) ;
					if( json.success ) {
						this.startPanel_onLoadAttrFile( peopleCalcAttribute, json.data ) ;
					} else {
						// Remove calc attr
					}
				},
				scope: this
			});
		},this) ;
	},
	startPanel_onLoadRHgrid: function(ajaxData) {
		this.rawRHgrid = ajaxData ;
	},
	startPanel_onLoadAttrFile: function( peopleCalcAttribute, ajaxData ) {
		this.map_calcAttribute_rawFile[peopleCalcAttribute] = ajaxData ;
	},
	startPanel_onLoad: function() {
		var me = this ;
		me.startSteps-- ;
		if( me.startSteps == 0 ) {
			delete this.startSteps ;
			me.doStartPanel() ;
		}
	},
	doStartPanel: function() {
		this.getEl().unmask() ;
		
		this.tmpModelName = 'RhAttributesValuesSetupModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.onDateSet(null) ;
	},
	
	onDateSet: function( date ) {
		var dateField = this.down('form').getForm().findField('date_apply') ;
		dateField.setReadOnly(date!=null) ;
		dateField.setValue(date) ;
		
		if( date==null ) {
			this.buildDateSummaryPanel() ;
			return ;
		}
		
		var dateSql = Ext.Date.format(date,'Y-m-d') ;
		if( !this.down('#pDateSummary') || !this.down('#pDateSummary').getStore().getById(dateSql) ) {
			Ext.MessageBox.confirm('Confirmation',"Date ("+dateSql+") non initialisée. Continuer ?", function(buttonStr) {
				if( buttonStr=='yes' ) {
					this.buildEditablePeoplePanel(dateSql) ;
				} else {
					this.onDateSet(null) ;
				}
			},this) ;
		} else {
			this.buildEditablePeoplePanel(dateSql) ;
		}
	},
	buildDateSummaryPanel: function() {
		var addModelFields = [],
			columns = [{
				width: 135,
				align: 'center',
				text: '<b>'+'Date application'+'</b>',
				dataIndex: 'date_apply',
				renderer: function(v) {
					return '<b>' + Ext.Date.format(Ext.Date.parse(v,'Y-m-d'),'d/m/Y') + '</b>' ;
				}
			}] ;
		
		Ext.Array.each(this.cfgPeopleCalcAttributes, function(peopleCalcAttr) {
			columns.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				width: 75,
				align: 'center',
				text: peopleCalcAttr.text,
				dataIndex: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				renderer: function(value,metaData,record) {
					if( value === true ) {
						metaData.tdCls = 'op5-spec-dbspeople-rh-attrsetup-ok'
					} 
					if( value === false ) {
						metaData.tdCls = 'op5-spec-dbspeople-rh-attrsetup-nok'
					}
				}
			});
			addModelFields.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				name: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				type: 'boolean',
				allowNull: true
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsPeopleRhAttributesValuesSetupDateModel',
			idPropery: 'date_apply',
			fields: addModelFields
		});
		
		var pGridContainer = this.down('#pGridContainer') ;
		pGridContainer.removeAll() ;
		pGridContainer.add({
			xtype: 'grid',
			itemId: 'pDateSummary',
			height: 400,
			columns: {
				defaults:{
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: columns
			},
			store: {
				model: this.tmpModelName,
				data: [],
				sorters: [{
					property: 'date_apply',
					direction: 'DESC'
				}]
			},
			listeners: {
				itemclick: function( view, record, itemNode, index, e ) {
					this.onDateSet(Ext.Date.parse(record.get('date_apply'),'Y-m-d')) ;
				},
				scope: this
			}
		});
		
		// ****** PREPARE DATA ********
			var map_dateSql_peopleCalcAttribute_enabled = {} ;
			var map_peopleCode_isActive = {} ;
			var nb_activePeople = 0 ;
			
			// List of active people ?
			Ext.Array.each(this.rawRHgrid, function(rowRH) {
				map_peopleCode_isActive[rowRH.people_code] = !rowRH.status_out ;
				if( !rowRH.status_out ) {
					nb_activePeople++ ;
				}
			}) ;
			
			// For each peopleCalcAttribute => how many active people per date ?
			Ext.Object.each(this.map_calcAttribute_rawFile, function(peopleCalcAttribute, rawFile) {
				Ext.Array.each(rawFile, function(fileRow) {
					if( !map_peopleCode_isActive[fileRow.people_code] ) {
						return ;
					}
					if( !map_dateSql_peopleCalcAttribute_enabled.hasOwnProperty(fileRow.date_apply) ) {
						map_dateSql_peopleCalcAttribute_enabled[fileRow.date_apply] = {} ;
					}
					if( !map_dateSql_peopleCalcAttribute_enabled[fileRow.date_apply].hasOwnProperty(peopleCalcAttribute) ) {
						map_dateSql_peopleCalcAttribute_enabled[fileRow.date_apply][peopleCalcAttribute] = 0 ;
					}
					map_dateSql_peopleCalcAttribute_enabled[fileRow.date_apply][peopleCalcAttribute]++ ;
				});
			}) ;
			
			var data = [] ;
			Ext.Object.each( map_dateSql_peopleCalcAttribute_enabled, function(dateSql, map_peopleCalcAttribute_nbEnabled) {
				var dataRow = {
					date_apply: dateSql
				};
				Ext.Object.each( map_peopleCalcAttribute_nbEnabled, function(peopleCalcAttribute, nbEnabled) {
					var mkey = 'calc_' + peopleCalcAttribute ;
					if( nbEnabled == nb_activePeople ) {
						dataRow[mkey] = true ;
					} else if( nbEnabled > 0 ) {
						dataRow[mkey] = false ;
					} else {
						dataRow[mkey] = null ;
					}
				});
				data.push(dataRow) ;
			}) ;
		
		// ****************************
		pGridContainer.down('#pDateSummary').getStore().loadRawData(data) ;
	},
	buildEditablePeoplePanel: function( dateSql ) {
		var addModelFields = [],
			columns = [{
				width: 190,
				align: 'left',
				text: '<b>'+'People'+'</b>',
				dataIndex: 'people_name'
			}] ;
		
		Ext.Array.each(this.cfgPeopleCalcAttributes, function(peopleCalcAttr) {
			columns.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				width: 75,
				align: 'center',
				text: peopleCalcAttr.text,
				dataIndex: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				renderer: function(v) {
					if( v === null ) {
						return '' ;
					}
					return '<b>'+v+'</b>'
				},
				editor: { xtype: 'numberfield', minValue: 0, keyNavEnabled: false, selectOnFocus: true, allowBlank: true }
			});
			addModelFields.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				name: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				type: 'number',
				allowNull: true
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsPeopleRhAttributesValuesSetupRowModel',
			idPropery: 'people_code',
			fields: addModelFields
		});
		
		var pGridContainer = this.down('#pGridContainer') ;
		pGridContainer.removeAll() ;
		pGridContainer.add({
			xtype: 'grid',
			itemId: 'pEditable',
			_dateSql: dateSql,
			height: 400,
			columns: {
				defaults:{
					menuDisabled: true,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: columns
			},
			store: {
				model: this.tmpModelName,
				data: [],
				sorters: [{
					property: 'people_code',
					direction: 'ASC'
				}]
			},
			plugins: [Ext.create('Optima5.Modules.Spec.DbsPeople.RhAttributesValuesSetupPanelCellEditing',{
				pluginId: 'cellediting',
				clicksToEdit: 1,
				listeners: {
					//beforeedit: me.onGridBeforeEdit,
					//validateedit: me.onGridAfterEdit,
					scope: this
				}
			})]
		});
		
		// ****** PREPARE DATA ********
			var map_peopleCode_dataRow = {} ;
			var map_peopleCode_peopleName = {} ;
			var nb_activePeople = 0 ;
			
			// List of people ?
			Ext.Array.each(this.rawRHgrid, function(rowRH) {
				if( rowRH.status_out ) {
					return ;
				}
				map_peopleCode_dataRow[rowRH.people_code] = {
					people_code: rowRH.people_code,
					people_name: rowRH.people_name
				} ;
			}) ;
			
			// For each peopleCalcAttribute => how many active people per date ?
			Ext.Object.each(this.map_calcAttribute_rawFile, function(peopleCalcAttribute, rawFile) {
				Ext.Array.each(rawFile, function(fileRow) {
					if( fileRow.date_apply != dateSql ) {
						return ;
					}
					if( !map_peopleCode_dataRow.hasOwnProperty(fileRow.people_code) ) {
						return ;
					}
					var mkey = 'calc_'+peopleCalcAttribute ;
					map_peopleCode_dataRow[fileRow.people_code][mkey] = fileRow.value ;
				});
			}) ;
			
			var data = Ext.Object.getValues(map_peopleCode_dataRow) ;
			console.dir(data) ;
		
		// ****************************
		pGridContainer.down('#pEditable').getStore().loadRawData(data) ;
	},
	
	doQuit: function() {
		if( !this.down('#pEditable') ) {
			this.destroy() ;
			return ;
		}
		Ext.MessageBox.confirm('Confirmation',"Enregistrer valeurs ?", function(buttonStr) {
			if( buttonStr=='yes' ) {
				this.doSaveAndExit() ;
			} else {
				this.destroy() ;
			}
		},this) ;
	},
	doSaveAndExit: function() {
		var pEditable = this.down('#pEditable'),
			dateSql = pEditable._dateSql ;
			
		this.getEl().mask('Saving...') ;
			
		this.saveCount = this.cfgPeopleCalcAttributes.length ;
		Ext.Array.each( this.cfgPeopleCalcAttributes, function(peopleCalcAttr) {
			var peopleCalcAttribute = peopleCalcAttr.peopleCalcAttribute,
				mkey = 'calc_'+peopleCalcAttribute ;
			var rawFile = [] ;
			Ext.Array.each( pEditable.getStore().getRange(), function(record) {
				rawFile.push({
					people_code: record.data['people_code'],
					date_apply: dateSql,
					value: record.data[mkey]
				}) ;
			})
			
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_people',
					_action: 'RH_setCalcAttributeSetupFile',
					people_calc_attribute: peopleCalcAttribute,
					data: Ext.JSON.encode(rawFile)
				},
				callback: function() {
					this.onSaveFile() ;
				},
				success: function( response ) {},
				scope: this
			});
		},this);
	},
	onSaveFile: function() {
		this.saveCount-- ;
		if( this.saveCount <= 0 ) {
			this.destroy() ;
		}
	}
});