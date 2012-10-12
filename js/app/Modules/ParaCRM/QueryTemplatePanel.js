Ext.define('QueryTemplateDemoModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'col1',  type: 'numeric'},
		{name: 'col2',  type: 'numeric'},
		{name: 'col3',  type: 'numeric'}
	],
	idProperty:'color_key'
});



Ext.define('Optima5.Modules.ParaCRM.QueryTemplatePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5paracrmquerytemplate',
			  
	requires: [
		'Ext.ux.dams.ColorCombo',
		'Optima5.Modules.ParaCRM.QueryTemplateManager'
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
		Ext.apply( me, {
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true
		}) ;
		
		me.colorsStore = Ext.create('Ext.data.Store',{
			data:me.colorsData,
			model:'QueryTemplateColorModel'
		}) ;
		
		me.queryPanelCfg = {} ;
		Ext.apply(me.queryPanelCfg,{
			
			
		});
		
		me.callParent() ;
		
		me.on({
			scope: me,
			activate: me.createPanel,
			deactivate: me.destroyPanel
		});
	},
			  
			  
	
	
	createPanel: function(){
		var me = this ;
		
		me.isActive = true ;
		
		me.removeAll();
	},
	destroyPanel: function(){
		var me = this ;
		
		me.isActive = false ;
		me.removeAll();
	},
			  
			  
	loadSettings: function() {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_gridTemplate',
			_subaction: 'load'
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
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
			cls:'op5paracrm-querygrid-demo',
			title:'Preview / Demo',
			flex: 2 ,
			items:[{
				xtype:'gridpanel' ,
				columns:[{
					text:'Col1',
					dataIndex:'col1',
					tdCls: 'op5paracrm-datacolumn',
					align: ''
				},{
					text:'Col2',
					dataIndex:'col2',
					tdCls: 'op5paracrm-datacolumn',
					align: ''
				},{
					text:'Progress',
					dataIndex:'col3',
					tdCls: 'op5paracrm-progresscolumn',
					align: '',
					renderer: function(value) {
						if( value > 0 ) {
							return '+ '+Math.abs(value) ;
						} else if( value < 0 ) {
							return '- '+Math.abs(value) ;
						} else {
							return '' ;
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
		Ext.util.CSS.removeStyleSheet('op5paracrmQuerygridDemo');
		
		if( !me.settingsRecord.get('template_is_on') ) {
			return ;
		}
		
		
		var cssBlob = '' ;
		
		columnColor = me.settingsRecord.get('colorhex_columns') ;
		cssBlob += ".op5paracrm-querygrid-demo .x-column-header { background-color:"+columnColor+"; background:"+columnColor+"; }\r\n" ;
		rowColor = me.settingsRecord.get('colorhex_row') ;
		cssBlob += ".op5paracrm-querygrid-demo .x-grid-row .x-grid-cell { background-color:"+rowColor+" }\r\n" ;
		rowColorAlt = me.settingsRecord.get('colorhex_row_alt') ;
		cssBlob += ".op5paracrm-querygrid-demo .x-grid-row-alt .x-grid-cell { background-color:"+rowColorAlt+" }\r\n" ;
		
		dataBold = me.settingsRecord.get('data_select_is_bold') ;
		cssBlob += ".op5paracrm-querygrid-demo .op5paracrm-datacolumn { font-weight:"+ (dataBold?'bold':'normal') +"; }\r\n" ;
		progressBold = me.settingsRecord.get('data_progress_is_bold') ;
		cssBlob += ".op5paracrm-querygrid-demo .op5paracrm-progresscolumn { font-weight:"+ (progressBold?'bold':'normal') +"; }\r\n" ;
		
		textAlign = me.settingsRecord.get('data_align') ;
		cssBlob += ".op5paracrm-querygrid-demo .x-grid-cell-inner { text-align:"+ textAlign +"; }\r\n" ;
		
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5paracrmQuerygridDemo');
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
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_gridTemplate',
			_subaction: 'save',
					  
			data_templatecfg: Ext.JSON.encode( me.settingsRecord.data ) ,
		});
		
		me.saveMaskSet(true) ;
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				me.saveMaskSet(false) ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					Optima5.Modules.ParaCRM.QueryTemplateManager.applySettingsRecord(me.settingsRecord) ;
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