Ext.define('Optima5.Modules.ParaCRM.DataFormPanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Optima5.CoreDesktop.Ajax',
		'Optima5.Modules.ParaCRM.DataFormPanelGmap',
		'Optima5.Modules.ParaCRM.BiblePicker' ,
		'Ext.ux.form.field.DateTime' ,
		'Optima5.Modules.ParaCRM.DataFormPanelGrid',
		'Optima5.Modules.ParaCRM.DataFormPanelGallery',
		'Ext.ux.dams.FieldTree',
		'Ext.ux.dams.GMapPanel',
		'Ext.container.ButtonGroup',
		'Ext.layout.container.Table',
		'Ext.tab.Panel'
	],
			  
	ajaxBaseParams : {},
	
	initComponent: function() {
		Ext.apply(this,{
			layout:{
				type:'vbox',
				align:'stretch'
			},
			
			/*
			items : [{
				xtype:'form',
				flex: 0,
				url : 'server/backend.php',
				baseParams: this.ajaxBaseParams ,
				//frame: true,
				bodyPadding: 5,
				fieldDefaults: {
						labelAlign: 'left',
						labelWidth: 75,
						anchor: '100%'
				},
			},{
				xtype:'tabpanel' ,
				flex: 1,
				//frame: true,
				activeTab: 0,
				defaults :{
						// bodyPadding: 10
				},
			}],
			*/
					 
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				ui: 'footer',
				defaults: {minWidth: 100},
				items: [
					{ xtype: 'component', flex: 1 },
					{ xtype: 'button', text: 'Save' , handler:this.onSave, scope:this },
					{ xtype: 'button', text: 'Cancel' , handler:this.onAbort , scope:this }
				]
			}]
		});
		
		
		// AJAX request
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, this.ajaxBaseParams );
		Ext.apply( ajaxParams, {
			_subaction : 'get_layout',
		}) ;
		
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false )
					return this.onAbort() ;
				else {
					this.addConfiguredComponents( Ext.decode(response.responseText).data ) ;
				}
			},
			scope: this
		});
		
		this.callParent() ;
	},
	
	addConfiguredComponents: function( layoutFromAjax ) {
		var me = this ;
		
		var formitems = new Array() ;
		Ext.Array.each( layoutFromAjax.form, function(v) {
			if( v.xtype=='damsfieldtree' ) {
				Ext.apply(v,{width:300,autoHeight:true}) ;
			}
			if( v.xtype=='textfield' && v.strToUpper==true ) {
				Ext.apply(v,{
					listeners: {
						change: function(obj,newValue){
							obj.setRawValue(newValue.toUpperCase().replace(' ','_'));
						}
					}
				});
			}
			formitems.push( v );
		}) ;
		var formconfig = new Object();
		Ext.apply( formconfig, {
			xtype:'form',
			url : 'server/backend.php',
			baseParams: this.ajaxBaseParams ,
			//frame: true,
			bodyPadding: 5,
			fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 100,
					anchor: '100%'
			},
			items: formitems
		});
		
		
		
		var tabitems = new Array() ;
		
		if( layoutFromAjax.gmap ) {
			var gmaptab = Ext.create('Optima5.Modules.ParaCRM.DataFormPanelGmap',{
				title:'Adr/GMap',
				ajaxBaseParams: this.ajaxBaseParams
			}) ;
			tabitems.push( gmaptab ) ;
		}
		
		//console.log('query?') ;
		if( layoutFromAjax.subfiles && layoutFromAjax.subfiles.length > 0 ) {
			//console.log('building some panels!!!') ;
			Ext.Array.each( layoutFromAjax.subfiles , function( cfgsubfile ) {
				//console.dir(cfgsubfile) ;
				switch( cfgsubfile.file_type ) {
					case 'media_img' :
						tabitems.push( this.buildSubfileGallery(cfgsubfile) ) ;
						break ;
					
					case 'grid' :
						tabitems.push( this.buildSubfilePanel(cfgsubfile) ) ;
						break ;
				}
			},this) ;
		}
		
		
		
		
		
		
		if( tabitems.length > 0 ) {
			var tabpanelcfg = new Object() ;
			Ext.apply(tabpanelcfg, {
				xtype:'tabpanel' ,
				flex: 1,
				//frame: true,
				activeTab: 0,
				defaults :{
						// bodyPadding: 10
				},
				items: tabitems
			}) ;
		}
		
		if( tabitems.length < 1 ) {
			Ext.apply( formconfig, {
				frame: true,
				flex: 1
			});
		}
		else {
			Ext.apply( formconfig, {
				flex: 0
			});
		}
		
		
		var thisitems = new Array() ;
		thisitems.push(formconfig) ;
		if( typeof(tabpanelcfg)!='undefined' ) {
			thisitems.push(tabpanelcfg) ;
		}
		
		this.add( thisitems ) ;
		//this.doLayout() ;
		this.loadEverything() ;
	},
	buildSubfilePanel: function( cfgsubfile ) {
		var me = this ;
		
		var columns = new Array() ;
		var colCfg = new Object() ;
		Ext.Array.each( cfgsubfile.columns, function(field) {
			colCfg = {
				flex: 1,
				dataIndex: field.code,
				sortable: false,
				text: field.lib,
				type: field.type
			} ;
			
			if( field.altdisplay && field.altdisplay != '' ) {
				Ext.apply( colCfg, {
					renderer: function(value,meta,record) {
						return record.get(field.altdisplay) ;
					}
				}) ;
			}

			switch( field.type ) {
				case 'link' :
					Ext.apply( colCfg, {
						flex:2,
						type: 'string',
						editor:{
							xtype:'op5paracrmbiblepicker',
							bibleId: field.linkbible ,
							allowBlank: !(field.is_header=='O')
						}
					});
					break ;
					
				case 'date' :
					Ext.apply( colCfg, {
						editor:{ xtype:'datetimefield' , allowBlank: !(field.is_header=='O') }
					});
					break ;
				
				case 'hidden' :
					Ext.apply( colCfg, {
						hidden:true
					});
					break ;
				
				default :
					Ext.apply( colCfg, {
						editor:{ xtype:'textfield', allowBlank: !(field.is_header=='O') }
					});
					break ;
			}
			
			
			
			
			columns.push(colCfg) ;
		},me) ;
		
		
		
		var ajaxBaseParams = {} ;
		Ext.apply( ajaxBaseParams , this.ajaxBaseParams ) ;
		Ext.apply( ajaxBaseParams , {
			subfile_code: cfgsubfile.file_code
		}) ;
		
		var objCfg = {} ;
		Ext.apply( objCfg, {
			xtype:'op5paracrmdataformpanelgrid' ,
			title:cfgsubfile.file_lib,
			itemId: cfgsubfile.file_code,
			url : 'server/backend.php',
			baseParams: ajaxBaseParams,
			loadParams: {
				_subaction: 'subfileData_get',
			},
			saveParams: {
				_subaction: 'subfileData_set',
			},
			columns : columns
		}) ;
		return objCfg ;
	},
	buildSubfileGallery: function( cfgsubfile ) {
		var ajaxBaseParams = {} ;
		Ext.apply( ajaxBaseParams , this.ajaxBaseParams ) ;
		Ext.apply( ajaxBaseParams , {
			subfile_code: cfgsubfile.file_code
		}) ;
		
		var objCfg = {} ;
		Ext.apply( objCfg, {
			xtype:'op5paracrmdataformpanelgallery' ,
			title:cfgsubfile.file_lib,
			itemId: cfgsubfile.file_code,
			url : 'server/backend.php',
			baseParams: ajaxBaseParams,
			loadParams: {
				_subaction: 'subfileGallery_get',
			},
			uploadParams: {
				_subaction: 'subfileGallery_upload',
			},
			deleteParams: {
				_subaction: 'subfileGallery_delete',
			}
		}) ;
		return objCfg ;
	},
			  
			  
	loadEverything: function() {
		var me = this ;
		me.query('form')[0].load({params:{ _subaction:'form_getValues' }}) ;
		//console.dir( me.query('tabpanel')[0].query('> panel') ) ;
		if( me.query('tabpanel').length > 0 ) {
			Ext.Array.each( me.query('tabpanel')[0].query('> panel'), function(item) {
				item.load() ;
			}) ;
		}
	},
			  
	
	onAbort: function(){
		this.destroy() ;
	},
	onSaveComponentCallback: function() {
		var me = this ;
		if( !me.nbComponentsSaved )
			me.nbComponentsSaved = 0 ;
		if( me.query('tabpanel').length > 0 ) {
			var nbToSave = 1 + me.query('tabpanel')[0].query('> panel').length ;
		}
		else {
			var nbToSave = 1 ;
		}
		if( me.nbComponentsSaved >= nbToSave )
			return ;
		me.nbComponentsSaved = me.nbComponentsSaved + 1 ;
		if( me.nbComponentsSaved === nbToSave ) {
			me.fireEvent('allsaved',me.nbComponentsSaved) ;
		}
	},
	onSave: function(){
		//console.dir( this.query('form')[0].getForm().owner.query('[isFormField]') );
		var me = this ;
		
		me.addEvents('allsaved') ;
		me.on('allsaved',function(nbSaved){
			// console.log('allsabed '+nbSaved) ;
			me.saveAndApply() ;
		},me) ;
		
		me.query('form')[0].submit({
			params:{ _subaction:'form_setValues' },
			success : me.onSaveComponentCallback,
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
		
		if( me.query('tabpanel').length > 0 ) {
			Ext.Array.each( me.query('tabpanel')[0].query('> panel'), function(item) {
				item.save(me.onSaveComponentCallback,me) ;
			}) ;
		}
		
	},
	saveAndApply: function() {
		var ajaxParams = Ext.apply( this.ajaxBaseParams, {
			_subaction : 'save_and_apply',
		}) ;
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Save failed. Unknown error');
				}
				else {
					this.fireEvent('transactionend') ;
					this.destroy() ;
				}
			},
			scope: this
		});
	}
	
});