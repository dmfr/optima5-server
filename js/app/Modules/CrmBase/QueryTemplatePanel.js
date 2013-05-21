Ext.define('QueryTemplateDemoModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'col1',  type: 'numeric'},
		{name: 'col2',  type: 'numeric'},
		{name: 'col3',  type: 'numeric'}
	],
	idProperty:'color_key'
});



Ext.define('Optima5.Modules.CrmBase.QueryTemplatePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5crmbasequerytemplate',
			  
	requires: [
		'Ext.ux.dams.ColorCombo',
		'Optima5.Modules.CrmBase.QueryTemplateManager'
	],
			  
	settingsRecord: null ,
			  
	colorsStore: null,
	colorsData : [{
		color_key:'orange',
		color_lib:'Orange',
		colorhex_columns:'#ff9c00',
		colorhex_row:'#ffeccf' ,
		colorhex_row_alt:'#ffe4ba'
	},{
		color_key:'blue',
		color_lib:'Blue',
		colorhex_columns:'#5377ff',
		colorhex_row:'#9bb0ff' ,
		colorhex_row_alt:'#b1c2ff'
	}],
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryTemplatePanel','No module reference ?') ;
		}
		
		Ext.apply( me, {
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
			autoDestroy: true
		}) ;
		
		me.colorsStore = Ext.create('Ext.data.Store',{
			data:me.colorsData,
			model:'QueryTemplateColorModel'
		}) ;
		
		me.callParent() ;
		
		me.loadSettings() ;
	},
			  
			  
	
	
	loadSettings: function() {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_gridTemplate',
			_subaction: 'load'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.settingsRecord = Ext.create('QueryTemplateSettings',Ext.decode(response.responseText).data_templatecfg) ;
					me.onSettingsLoaded();
				}
			},
			scope: this
		});
	},
	onSettingsLoaded: function() {
		var me = this ;
		
		// construction du panel (form + demo)
		me.removeAll() ;
		
		me.add({
			xtype:'form',
			itemId:'form',
			flex:1,
			title:'Query Template settings',
			frame:true,
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'checkboxfield',
				name: 'template_is_on',
				boxLabel: 'Templates enabled'
			},{
				xtype: 'fieldset',
				title: 'Color Theme',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype:'colorcombo',
				 	name: 'color_key',
					store:me.colorsStore,
					forceSelection: true,
					editable: false,
					valueField: 'color_key',
					displayField: 'color_lib',
					iconColorField: 'colorhex_columns',
					queryMode: 'local'
				}]
			},{
				xtype: 'fieldset',
				title: 'Data paging',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items:[{
					xtype:'combobox',
					name: 'data_align',
					fieldLabel: 'Alignment',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['key','lib'],
						data : [
							{key:'left', lib:'Left'},
							{key:'center', lib:'Center'},
							{key:'right', lib:'Right'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'key'
				},{
					xtype: 'checkboxfield',
					name: 'data_select_is_bold',
					boxLabel: 'Bold results'
				},{
					xtype: 'checkboxfield',
					name: 'data_progress_is_bold',
					boxLabel: 'Bold progress steps'
				}]
			}],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				ui: 'footer',
				defaults: {minWidth: 100},
				items: [
					{ xtype: 'component', flex: 1 },
					{ xtype: 'button', text: 'Save' , handler:me.saveSettings, scope:me }
				]
			}]
		});
		
		me.add({
			xtype:'panel',
			cls:'op5crmbase-querygrid-demo',
			title:'Preview / Demo',
			flex: 2 ,
			items:[{
				xtype:'gridpanel' ,
				columns:[{
					text:'Col1',
					dataIndex:'col1',
					tdCls: 'op5crmbase-datacolumn',
					align: ''
				},{
					text:'Col2',
					dataIndex:'col2',
					tdCls: 'op5crmbase-datacolumn',
					align: ''
				},{
					text:'Progress',
					dataIndex:'col3',
					tdCls: 'op5crmbase-progresscolumn',
					align: '',
					renderer: function(value,meta) {
						if( value > 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-pos' ;
							return '+ '+Math.abs(value) ;
						} else if( value < 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-neg' ;
							return '- '+Math.abs(value) ;
						} else if( value==='' ) {
							return '' ;
						} else {
							return '=' ;
						}
					}
				}],
				columnLines: true,
				store:{
					model:'QueryTemplateDemoModel',
					data:[
						{col1:1.111, col2:2.222, col3:+1.111},
						{col1:4.111, col2:5.222, col3:-1.111},
						{col1:7.111, col2:8.222, col3:+2.345}
					]
				}
			}]	
		}); 
		
		// form : load Model
		me.getComponent('form').loadRecord( me.settingsRecord ) ;
		
		// attach form change => save to model
		me.getComponent('form').getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.onFormChanged() ;
			},me) ;
		},me) ;
		
		// applyStyleToGrid
		me.applyDemoGrid() ;
	},
			  
	applyDemoGrid: function() {
		var me = this ;
		// remove grid from panel 2
		
		// build a new grid
		
		// apply styles
		Ext.util.CSS.removeStyleSheet('op5crmbaseQuerygridDemo');
		
		if( !me.settingsRecord.get('template_is_on') ) {
			return ;
		}
		
		
		var cssBlob = '' ;
		
		columnColor = me.settingsRecord.get('colorhex_columns') ;
		cssBlob += ".op5crmbase-querygrid-demo .x-column-header { background-color:"+columnColor+"; background:"+columnColor+"; }\r\n" ;
		rowColor = me.settingsRecord.get('colorhex_row') ;
		cssBlob += ".op5crmbase-querygrid-demo .x-grid-row .x-grid-cell { background-color:"+rowColor+" }\r\n" ;
		rowColorAlt = me.settingsRecord.get('colorhex_row_alt') ;
		cssBlob += ".op5crmbase-querygrid-demo .x-grid-row-alt .x-grid-cell { background-color:"+rowColorAlt+" }\r\n" ;
		
		dataBold = me.settingsRecord.get('data_select_is_bold') ;
		cssBlob += ".op5crmbase-querygrid-demo .op5crmbase-datacolumn { font-weight:"+ (dataBold?'bold':'normal') +"; }\r\n" ;
		progressBold = me.settingsRecord.get('data_progress_is_bold') ;
		cssBlob += ".op5crmbase-querygrid-demo .op5crmbase-progresscolumn { font-weight:"+ (progressBold?'bold':'normal') +"; }\r\n" ;
		
		textAlign = me.settingsRecord.get('data_align') ;
		cssBlob += ".op5crmbase-querygrid-demo .op5crmbase-datacolumn .x-grid-cell-inner { text-align:"+ textAlign +"; }\r\n" ;
		cssBlob += ".op5crmbase-querygrid-demo .op5crmbase-progresscolumn .x-grid-cell-inner { text-align:left; }\r\n" ;
		
		cssBlob += ".op5crmbase-querygrid-demo .op5crmbase-progresscell-pos .x-grid-cell-inner { color: green; }\r\n" ;
		cssBlob += ".op5crmbase-querygrid-demo .op5crmbase-progresscell-neg .x-grid-cell-inner { color: red; }\r\n" ;
		
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5crmbaseQuerygridDemo');
	},
	
	onFormChanged: function() {
		var me = this ;
		var mform = me.getComponent('form') ;
	
		Ext.Object.each( mform.getForm().getFieldValues() , function(k,v){
			switch( k ) {
				case 'color_key' :
					me.settingsRecord.set('color_key',v) ;
					var colorRecord = me.colorsStore.getById(v) ;
					if( colorRecord != null ) {
						me.settingsRecord.set('colorhex_columns',colorRecord.get('colorhex_columns')) ;
						me.settingsRecord.set('colorhex_row',colorRecord.get('colorhex_row')) ;
						me.settingsRecord.set('colorhex_row_alt',colorRecord.get('colorhex_row_alt')) ;
					}
					break ;
				
				default :
					me.settingsRecord.set(k,v) ;
					break ;
			}
			
			
		},me) ;
		
		me.applyDemoGrid() ;
	},
	
			  
	saveSettings: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_gridTemplate',
			_subaction: 'save',
					  
			data_templatecfg: Ext.JSON.encode( me.settingsRecord.data ) ,
		});
		
		me.saveMaskSet(true) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				me.saveMaskSet(false) ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					Optima5.Modules.CrmBase.QueryTemplateManager.applySettingsRecord(me.optimaModule.sdomainId, me.settingsRecord) ;
				}
			},
			scope: me
		});
	},
	saveMaskSet: function( trueOfFalse ) {
		var me = this ;
		if( !me.saveMask ) {
			me.saveMask = Ext.create('Ext.LoadMask',me,{msg:'Wait...'}) ;
		}
		if( trueOfFalse === true ) {
			me.saveMask.show() ;
		}
		if( trueOfFalse === false ) {
			me.saveMask.hide() ;
		}
	}
	
});