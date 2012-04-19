Ext.define('Optima5.Modules.ParaCRM.BibleFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.op5paracrmbible',

    requires: ['Ext.selection.CheckboxModel'] ,

    /**
     * @cfg {String} iconCls
     * The iconCls to be applied to the menu item.
     * Defaults to <tt>'ux-gridfilter-text-icon'</tt>.
     */
    iconCls : 'ux-gridfilter-text-icon',

    emptyText: 'Enter Filter Text...',
    selectOnFocus: true,
    width: 125,
			  
	inputValue: [],

    /**
     * @private
     * Template method that is to initialize the filter and install required menu items.
     */
    init : function (config) {
        Ext.applyIf(config, {
            enableKeyEvents: true,
            iconCls: this.iconCls,
            hideLabel: true,
            listeners: {
                scope: this,
                keyup: this.onInputKeyUp,
                el: {
                    click: function(e) {
                        e.stopPropagation();
                    }
                }
            }
        });

        this.updateTask = Ext.create('Ext.util.DelayedTask', this.onTypeAhead, this);
		  
		  
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: {
				_moduleName: 'paracrm',
				_action : 'data_getBibleCfg',
				bible_code : this.bibleId
			},
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					// this.bibleId = bibleId ;
					this.initSetupBible( Ext.decode(response.responseText).data ) ;
				}
				else {
					this.bibleId = '' ;
				}
			},
			scope: this
		});
		  
    },
			  
	initSetupBible: function( ajaxDataBibleCfg ) {
		var me = this ;
		// me.inputEl.addCls('icon-bible-edit') ;
		//console.dir(me.divicon) ;
		//me.divicon.addCls('biblepicker-iconimg') ;
		// me.inputEl.dom.innerHTML = '<b>ijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsj</b>' ;
		
		this.myModelname = this.id+'-'+'dynModel' ;
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		Ext.Object.each( ajaxDataBibleCfg.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) && false )
				return ;
			if( v.entry_field_is_key == true )
				keyfield = v.tree_field_code ;
			
			switch( v.entry_field_type )
			{
				case 'numeric' :
				case 'date' :
					var fieldType = v.entry_field_type ;
					break ;
					
				default :
					var fieldType = 'string' ;
					break ;
			}
			
			var fieldObject = new Object();
			Ext.apply(fieldObject,{
				name: v.entry_field_code,
				type: fieldType
			}) ;
			modelFields.push( fieldObject ) ;
		},this) ;
		Ext.define(this.myModelname, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		
		
		this.myColumns = new Array() ;
		Ext.Object.each( ajaxDataBibleCfg.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) )
				return ;
			if( !(v.entry_field_is_header) )
				return ;
			
			switch( v.entry_field_type )
			{
				default :
					break ;
			}
			
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.entry_field_lib,
            flex: 1,
            sortable: false,
            dataIndex: v.entry_field_code,
				menuDisabled: true,
				xtype:'gridcolumn'
			}) ;
			this.myColumns.push( columnObject ) ;
		},this) ;
		
		this.myStore = Ext.create('Ext.data.Store', {
			model: this.myModelname,
			proxy: {
				type: 'ajax',
				url: 'server/backend.php',
				extraParams : {
					_sessionName: op5session.get('session_id'),
					_moduleName: 'paracrm' ,
					_action: 'data_getBibleGrid' ,
					bible_code: this.bibleId
				},
				actionMethods: {
					read:'POST'
				},
				reader: {
					type: 'json',
					root: 'data',
					totalProperty: 'total'
				}
			}
		});
		
		
		me.myStore.on('load',function(){
		},me,{
			single:true
		}) ;
		
		// console.log('finished') ;
		
		this.on('destroy',function(){
			var model = Ext.ModelManager.getModel(this.myModelname);
			Ext.ModelManager.unregister(model);
			// console.log("unregister model "+this.myModelname) ;
		},this) ;
		
		
		this.menu.add({
			xtype:'gridpanel',
			viewConfig: {
				loadMask: false
			},
			store: me.myStore,
			columns: me.myColumns,
			height: 250,
			width:400,
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				}
			},
			selModel: Ext.create('Ext.selection.CheckboxModel',{
				mode: 'MULTI',
				checkOnly: true,
				listeners: {
					selectionchange:{
						fn:me.onSelectionChange,
						scope:me
					}
				}
			}),
			tbar : [{
				xtype:'textfield',
				flex:1,
				enableKeyEvents: true,
				listeners: {
					scope: this,
					keyup: this.onInputKeyUp,
					el: {
						click: function(e) {
								e.stopPropagation();
						}
					}
				}
			},{
				xtype:'button',
				iconCls : 'icon-cancel' ,
				handler : function(button,event) {
					me.menu.query('gridpanel')[0].getSelectionModel().deselectAll() ;
				},
				scope : me
			}]
		});
		
		me.menu.on('beforeshow',function(){
			me.onMenuBeforeShow() ;
		},me) ;
		me.menu.on('hide',function(){
			me.onMenuHide() ;
		},me) ;
	},
			  
	onInputKeyUp : function (field, e) {
		// restart the timer
		this.updateTask.delay(this.updateBuffer);
	},
	onTypeAhead: function() {
		var me = this ;
		
		var textfield = me.menu.query('gridpanel')[0].getDockedItems('toolbar')[0].query('textfield')[0] ;
		var mvalue = textfield.getRawValue() ;
		if( mvalue.length == 0 ) {
			me.myStore.load() ;
			return ;
		}
		if( mvalue.length < 3 ) {
			me.myStore.removeAll() ;
			return ;
		}
		
		me.myStore.load({
			filters : [new Ext.util.Filter({
				property: 'str_search',
				value   : mvalue
			})]
		}); ;
	},
	onTypeAheadLocal: function() {
		var me = this ;
		
		var textfield = me.menu.query('gridpanel')[0].getDockedItems('toolbar')[0].query('textfield')[0] ;
		var mvalue = textfield.getRawValue() ;
		
		me.myStore.filterBy( function(record) {
			if( mvalue.length < 3 )
				return false ;
			var found = false ;
			Ext.each( me.myColumns , function(col) {
				if( record.get( col.dataIndex ).toLowerCase().indexOf(mvalue.toLowerCase()) != -1 ) {
					found = true ;
				}
			}, me);
			return found ;
		},me ) ;
	},
	
	onSelectionChange: function(selmodel, selrecords){
		var me = this ;
		
		if( me.silentSelection ) {
			return ;
		}
		
		// console.log('selection changed') ;

		var mTab = new Array() ;
		Ext.Object.each( selrecords, function(k,o){
			mTab.push(o.get('entry_key')) ;
		}) ;
		me.inputValue = mTab ;
		
		me.fireUpdate() ;
	},
	isActivatable : function () {
		return this.getValue().length > 0;
	},
	getSerialArgs : function () {
		var me = this ;
		return {type: 'list', value: this.phpMode ? me.getValue().join(',') : me.getValue()};
	},
	getValue : function() {
		var me = this ;
		return me.inputValue ;
	},
	setValue : function(value) {
		var me = this ;
		
		// Load de la valeur
		value = me.inputValue = [].concat(value);
		this.fireEvent('update', this);
	},
			  
	onMenuBeforeShow: function() {
		var me = this ;
		
		if( me.menu.rendered && this.getValue().length > 0 ) {
			me.silentSelection = true ;
			me.menu.query('gridpanel')[0].getSelectionModel().deselectAll(true) ;
			me.silentSelection = false ;
			
			var parameters = new Object() ;
			Ext.apply(parameters,{
				filters: [ new Ext.util.Filter({
					property: 'entry_key',
					value   : this.getValue()
				})]
			});
			me.myStore.on('load',function(mstore,mrecords){
				me.silentSelection = true ;
				me.menu.query('gridpanel')[0].getSelectionModel().selectAll(true) ;
				me.silentSelection = false ;
			},me,{
				single:true
			});
			me.myStore.load(parameters) ;
		}
		else {
			me.myStore.load() ;
		}
	},
	onMenuHide: function() {
		var me = this ;
		
		if( me.menu.rendered ) {
			me.silentSelection = true ;
			me.menu.query('gridpanel')[0].getSelectionModel().deselectAll(true) ;
			me.silentSelection = false ;
			
			me.myStore.removeAll() ;
			
			me.menu.query('gridpanel')[0].getDockedItems('toolbar')[0].query('textfield')[0].setRawValue('') ;
		}
		else {
			// rien
		}
	}


});